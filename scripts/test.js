const path = require('path')
const { runBuild, UtsTarget } = require('../packages/uts/dist')
const projectDir = path.resolve(__dirname, '../packages/playground/uts')
// uts
runBuild(UtsTarget.KOTLIN, {
  silent: false,
  input: {
    dir: path.resolve(projectDir, 'nativeplugins/test-uniplugin'),
    extname: '.uts',
  },
  output: {
    dir: path.resolve(
      projectDir,
      'unpackage/nativeplugins/test-uniplugin-android'
    ),
    sourceMap: false,
    inlineSourcesContent: false,
  },
})
runBuild(UtsTarget.SWIFT, {
  silent: false,
  input: {
    dir: path.resolve(projectDir, 'nativeplugins/test-uniplugin'),
    extname: '.uts',
  },
  output: {
    dir: path.resolve(projectDir, 'unpackage/nativeplugins/test-uniplugin-ios'),
    sourceMap: false,
    inlineSourcesContent: false,
  },
})
