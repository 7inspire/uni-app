import type { WatchOptions } from 'chokidar'
import type { Plugin, ResolvedConfig } from 'vite'
import { FileWatcher, FileWatcherOptions } from '../../watcher'
import { M } from '../../messages'

export type UniViteCopyPluginTarget = Omit<FileWatcherOptions, 'verbose'> & {
  watchOptions?: WatchOptions
}
export interface UniViteCopyPluginOptions {
  targets: UniViteCopyPluginTarget[]
  verbose: boolean
}
export function uniViteCopyPlugin({
  targets,
  verbose,
}: UniViteCopyPluginOptions): Plugin {
  let resolvedConfig: ResolvedConfig
  let inited = false
  return {
    name: 'uni:copy',
    apply: 'build',
    configResolved(config) {
      resolvedConfig = config
    },
    writeBundle() {
      if (inited) {
        return
      }
      if (resolvedConfig.build.ssr) {
        return
      }
      inited = true
      return new Promise((resolve) => {
        Promise.all(
          targets.map(({ watchOptions, ...target }) => {
            return new Promise((resolve) => {
              new FileWatcher({
                verbose,
                ...target,
              }).watch(
                {
                  cwd: process.env.UNI_INPUT_DIR,
                  ...watchOptions,
                },
                (watcher) => {
                  if (process.env.NODE_ENV !== 'development') {
                    // 生产模式下，延迟 close，否则会影响 chokidar 初始化的 add 等事件
                    setTimeout(() => {
                      watcher.close().then(() => resolve(void 0))
                    }, 1000)
                  } else {
                    resolve(void 0)
                  }
                },
                () => {
                  console.log(M['dev.watching.end'])
                }
              )
            })
          })
        ).then(() => resolve())
      })
    },
  }
}
