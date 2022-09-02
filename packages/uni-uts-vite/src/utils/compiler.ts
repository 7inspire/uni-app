import os from 'os'
import fs from 'fs-extra'
import path from 'path'
import AdmZip from 'adm-zip'
import { sync } from 'fast-glob'
import type { parse, bundle, UtsTarget } from '@dcloudio/uts'
import {
  installHBuilderXPlugin,
  isInHBuilderX,
  normalizePath,
  resolveSourceMapPath,
} from '@dcloudio/uni-cli-shared'
import { camelize } from '@vue/shared'

export function getUtsCompiler(): {
  parse: typeof parse
  bundle: typeof bundle
  UtsTarget: typeof UtsTarget
} {
  // eslint-disable-next-line no-restricted-globals
  return require('@dcloudio/uts')
}
export async function compile(filename: string) {
  if (!process.env.UNI_HBUILDERX_PLUGINS) {
    return
  }
  const { bundle, UtsTarget } = getUtsCompiler()
  const inputDir = process.env.UNI_INPUT_DIR
  const outputDir = process.env.UNI_OUTPUT_DIR
  // let time = Date.now()
  await bundle({
    target: UtsTarget.KOTLIN,
    input: {
      root: inputDir,
      filename,
    },
    output: {
      outDir: outputDir,
      package: parsePackage(filename),
      sourceMap: resolveSourceMapPath(
        process.env.UNI_OUTPUT_DIR,
        process.env.UNI_PLATFORM
      ),
      extname: 'kt',
      imports: [
        'kotlinx.coroutines.async',
        'kotlinx.coroutines.CoroutineScope',
        'kotlinx.coroutines.Deferred',
        'kotlinx.coroutines.Dispatchers',
        'io.dcloud.uts.*',
      ],
      logFilename: true,
      noColor: isInHBuilderX(),
    },
  })
  // console.log('uts compile time: ' + (Date.now() - time) + 'ms')

  const kotlinFile = resolveKotlinFile(filename, inputDir, outputDir)
  if (process.env.NODE_ENV === 'production') {
    const androidInputDir = resolveAndroidDir(filename)
    const androidOutputDir = resolveAndroidDir(kotlinFile)
    // 生产模式下，需要将 kt 文件转移到 src 下
    const cfgJson = path.resolve(androidInputDir, 'config.json')
    if (fs.existsSync(cfgJson)) {
      fs.copyFileSync(cfgJson, path.resolve(androidOutputDir, 'config.json'))
    }
    fs.mkdirSync(path.resolve(androidOutputDir, 'src'))
    if (fs.existsSync(kotlinFile)) {
      fs.moveSync(kotlinFile, path.resolve(androidOutputDir, 'src/index.kt'))
    }
    const kotlinMapFile = kotlinFile + '.map'
    if (fs.existsSync(kotlinMapFile)) {
      fs.moveSync(
        kotlinMapFile,
        path.resolve(androidOutputDir, 'src/index.map.kt')
      )
    }

    const copies = ['assets', 'libs', 'res']
    if (fs.existsSync(androidInputDir)) {
      fs.readdirSync(androidInputDir).forEach((file) => {
        if (copies.includes(file)) {
          fs.copySync(
            path.join(androidInputDir, file),
            path.join(androidOutputDir, file)
          )
        }
      })
    }
  } else if (process.env.NODE_ENV === 'development') {
    // 开发模式下，需要生成 dex
    if (fs.existsSync(kotlinFile)) {
      const compilerServer = getCompilerServer()
      if (!compilerServer) {
        return
      }
      const { getDefaultJar, getKotlincHome, compile } = compilerServer
      // time = Date.now()
      const jarFile = resolveJarPath(kotlinFile)
      const options = {
        kotlinc: resolveKotlincArgs(
          kotlinFile,
          getKotlincHome(),
          getDefaultJar().concat(resolveLibs(filename))
        ),
        d8: resolveD8Args(jarFile),
      }
      const res = await compile(options, process.env.UNI_INPUT_DIR)
      // console.log('dex compile time: ' + (Date.now() - time) + 'ms')
      if (res) {
        try {
          fs.unlinkSync(jarFile)
          // 短期内先不删除，方便排查问题
          // fs.unlinkSync(kotlinFile)
        } catch (e) {}
        const dexFile = resolveDexFile(jarFile)
        if (fs.existsSync(dexFile)) {
          return normalizePath(path.relative(outputDir, dexFile))
        }
      }
    }
  }
}

function resolveKotlincArgs(filename: string, kotlinc: string, jars: string[]) {
  return [
    filename,
    '-cp',
    resolveClassPath(jars),
    '-d',
    resolveJarPath(filename),
    '-kotlin-home',
    kotlinc,
  ]
}

function resolveD8Args(filename: string) {
  return [
    filename,
    '--no-desugaring',
    '--min-api',
    '19',
    '--output',
    resolveDexPath(filename),
  ]
}

function resolveLibs(filename: string) {
  const libsPath = path.resolve(resolveAndroidDir(filename), 'libs')
  const libs: string[] = []
  if (fs.existsSync(libsPath)) {
    libs.push(...sync('*.jar', { cwd: libsPath, absolute: true }))
    const zips = sync('*.aar', { cwd: libsPath })
    zips.forEach((name) => {
      const outputPath = resolveAndroidArchiveOutputPath(name)
      if (!fs.existsSync(outputPath)) {
        // 解压
        const zip = new AdmZip(path.resolve(libsPath, name))
        zip.extractAllTo(outputPath, true)
      }
    })
    if (zips.length) {
      libs.push(
        ...sync('*/*.jar', {
          cwd: resolveAndroidArchiveOutputPath(),
          absolute: true,
        })
      )
    }
  }
  return libs
}

function resolveAndroidArchiveOutputPath(aar?: string) {
  return path.resolve(
    process.env.UNI_OUTPUT_DIR,
    '../.uts/aar',
    aar ? aar.replace('.aar', '') : ''
  )
}
function resolveDexFile(jarFile: string) {
  return normalizePath(path.resolve(path.dirname(jarFile), 'classes.dex'))
}

function resolveAndroidDir(filename: string) {
  const maybeAndroidDir = path.dirname(filename)
  // 如果是根目录的index.uts编译出来的index.kt，则移动到app-android下
  const isRootIndex = path.basename(maybeAndroidDir) !== 'app-android'
  if (isRootIndex) {
    if (maybeAndroidDir.includes('uni_modules')) {
      return path.join(maybeAndroidDir, 'utssdk/app-android')
    }
    return path.join(maybeAndroidDir, 'app-android')
  }
  return maybeAndroidDir
}

function resolveKotlinFile(
  filename: string,
  inputDir: string,
  outputDir: string
) {
  let ktFile = path
    .resolve(outputDir, path.relative(inputDir, filename))
    .replace(path.extname(filename), '.kt')
  const maybeModuleDir = path.dirname(filename)
  // 如果是根目录的index.uts编译出来的index.kt，则移动到app-android下
  const isRootIndex = path.basename(maybeModuleDir) !== 'app-android'
  if (isRootIndex) {
    if (fs.existsSync(ktFile)) {
      const newKtFile = path.resolve(
        path.dirname(ktFile),
        (maybeModuleDir.includes('uni_modules') ? 'utssdk/' : '') +
          'app-android/index.kt'
      )
      fs.moveSync(ktFile, newKtFile)
      ktFile = newKtFile
    }
  }
  return ktFile
}

function resolveDexPath(filename: string) {
  return path.dirname(filename)
}

function resolveJarPath(filename: string) {
  return filename.replace(path.extname(filename), '.jar')
}

function resolveClassPath(jars: string[]) {
  return jars.join(os.platform() === 'win32' ? ';' : ':')
}

const getCompilerServer = ():
  | {
      getKotlincHome(): string
      getDefaultJar(): string[]
      compile(
        options: { kotlinc: string[]; d8: string[] },
        projectPath: string
      ): Promise<boolean>
    }
  | false => {
  try {
    const compilerServerPath = path.resolve(
      process.env.UNI_HBUILDERX_PLUGINS,
      'uniapp-runextension/out/main.js'
    )
    // eslint-disable-next-line no-restricted-globals
    return require(compilerServerPath)
  } catch (e) {
    installHBuilderXPlugin('uniapp-runextension')
  }
  return false
}

export function parsePackage(filepath: string) {
  const parts = normalizePath(filepath).split('/')

  const isUniModules = parts.includes('uni_modules')
  const index = isUniModules
    ? parts.findIndex((part) => part === 'uni_modules')
    : parts.findIndex((part) => part === 'utssdk')
  if (index > -1) {
    return (
      'uts.sdk.' + (isUniModules ? 'modules.' : '') + camelize(parts[index + 1])
    )
  }
  return ''
}
