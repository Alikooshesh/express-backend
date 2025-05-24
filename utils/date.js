function isDateString(val) {
    // Check for ISO 8601 or YYYY-MM-DD
    return (
      typeof val === 'string' &&
      (
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(val) || // ISO 8601
        /^\d{4}-\d{2}-\d{2}$/.test(val) // YYYY-MM-DD
      )
    );
  }

  module.exports = {isDateString}