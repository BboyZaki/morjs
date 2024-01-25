module.exports = function esbuildMocker(esbuild) {
  const _mockFiles = Object.create(null);

  esbuild.build = (opts) => {
    return _mockFiles[opts] || undefined
  }

  return esbuild
}
