/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Configuration } from 'webpack';
import { WebpackConfigOptions } from '../build-options';
import { getSourceMapDevTool } from './utils';


/**
 * Returns a partial specific to creating a bundle for node
 * @param wco Options which are include the build options and app config
 */
export function getServerConfig(wco: WebpackConfigOptions) {

  const extraPlugins = [];
  if (wco.buildOptions.sourceMap) {
    const { scripts, styles, hidden } = wco.buildOptions.sourceMap;

    extraPlugins.push(getSourceMapDevTool(
      scripts,
      styles,
      hidden,
    ));
  }

  const config: Configuration = {
    resolve: {
      mainFields: [
        ...(wco.supportES2015 ? ['es2015'] : []),
        'main', 'module',
      ],
    },
    target: 'node',
    output: {
      libraryTarget: 'commonjs',
    },
    plugins: extraPlugins,
    node: false,
  };

  if (wco.buildOptions.bundleDependencies == 'none') {
    config.externals = [
      /^@angular/,
      // tslint:disable-next-line:no-any
      (_: any, request: any, callback: (error?: any, result?: any) => void) => {
        // Absolute & Relative paths are not externals
        if (request.match(/^\.{0,2}\//)) {
          return callback();
        }

        try {
          // Attempt to resolve the module via Node
          const e = require.resolve(request);
          if (/node_modules/.test(e)) {
            // It's a node_module
            callback(null, request);
          } else {
            // It's a system thing (.ie util, fs...)
            callback();
          }
        } catch {
          // Node couldn't find it, so it must be user-aliased
          callback();
        }
      },
    ];
  }

  return config;
}
