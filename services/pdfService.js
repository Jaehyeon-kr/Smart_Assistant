const fs = require('fs');
const pdf = require('pdf-parse');

const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    return {
      text: data.text,
      pages: data.numpages,
    };
  } catch (err) {
    console.error('PDF 텍스트 추출 오류:', err);
    throw err;
  }
};

module.exports = {
  extractTextFromPDF,
};
