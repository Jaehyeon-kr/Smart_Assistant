const { Anthropic } = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 1. 요약 생성
const generateSummary = async (extractedText) => {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `다음 PDF 내용을 한국어로 요약해주세요:\n\n${extractedText.substring(0, 8000)}`,
        },
      ],
    });

    return message.content[0].type === 'text' ? message.content[0].text : null;
  } catch (err) {
    console.error('Claude API 요약 생성 오류:', err);
    return null;
  }
};

// 2. 문제 생성 (4선지 객관식 5개)
const generateQuestions = async (extractedText) => {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `다음 PDF 내용을 바탕으로 4선지 객관식 문제 5개를 JSON 형식으로 생성해주세요.

응답 형식: [{"question":"문제","options":["①","②","③","④"],"answer":0}]
answer는 0~3 (정답 보기 인덱스)

PDF 내용:
${extractedText.substring(0, 8000)}`,
        },
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : null;
    if (content) {
      // JSON 파싱 시도
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    return null;
  } catch (err) {
    console.error('Claude API 문제 생성 오류:', err);
    return null;
  }
};

// 3. AI 튜터 (스트리밍)
const streamAITutor = async (extractedText, userMessage, history) => {
  try {
    const safeHistory = Array.isArray(history) ? history : [];
    const messages = [
      ...safeHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: `당신은 학생의 학습을 돕는 교육 튜터입니다. 다음 PDF 내용을 바탕으로 학생의 질문에 답변하세요:

${extractedText.substring(0, 8000)}`,
      messages,
    });

    return stream;
  } catch (err) {
    console.error('Claude API 튜터 오류:', err);
    throw err;
  }
};

module.exports = {
  generateSummary,
  generateQuestions,
  streamAITutor,
};
