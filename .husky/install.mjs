// Bỏ qua trong CI, production và khi cài không có dev dependency.
if (process.env.CI === 'true' || process.env.NODE_ENV === 'production') {
  process.exit(0);
}

try {
  const { default: husky } = await import('husky');
  const output = husky();
  if (output) {
    console.log(output);
  }
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') {
    throw error;
  }
}
