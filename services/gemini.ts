const ai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, 
  baseURL: import.meta.env.VITE_BASE_URL,
  dangerouslyAllowBrowser: true, 
  defaultHeaders: {
    "HTTP-Referer": window.location.origin,
    "X-Title": "Inspiration Script Matrix", 
  }
});

export const generateOutline = async (
  novel: string,
  styleRef: string,
  formatRef: string,
  mode: 'male' | 'female'
) => {
  const prompt = `
    你是一位资深的动漫爽剧编剧。请根据以下原著内容，分析并创作一份深度故事大纲。
    
    【核心要求】：
    1. 风格：符合2025年最火的动漫爽剧节奏，${mode === 'male' ? '男频（热血、升级、打脸、称霸）' : '女频（虐恋、重生、复仇、团宠）'}风格。
    2. 字数：2000-3000字深度大纲，涵盖起承转合。
    3. 结构：完本建议60-100集，单集2-3分钟。
    4. 阶段规划（核心）：你必须将全剧划分为若干阶段。每个阶段5-9集。
    
    【重要指令】：
    在大纲正文结束后，请务必以“【阶段详细规划开始】”和“【阶段详细规划结束】”为标记，列出具体的阶段计划。
    你必须根据原著内容，明确指出每个阶段对应原著的章节范围。
    
    格式必须严格遵循以下示例：
    第1阶段：[1-6]集，原著【1-12】章节，核心爽点：[描述]
    第2阶段：[7-15]集，原著【13-25】章节，核心爽点：[描述]
    ...

    5. 排版参考：${formatRef || '标准剧本大纲排版'}
    6. 文笔参考：${styleRef || '极具张力、高信息量'}

    【原著内容】：
    ${novel}
  `;

  const response = await ai.chat.completions.create({
    model: "gemini-3-pro-preview", 
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
  });

  return response.choices[0].message.content;
};


export const generateScriptPhase = async (
  novel: string,
  outline: string,
  currentPhasePlan: string,
  cumulativeSummary: string,
  styleRef: string,
  formatRef: string,
  mode: 'male' | 'female',
  phaseIndex: number
) => {
  const episodeCountMatch = currentPhasePlan.match(/\[(\d+)-(\d+)\]集/);
  const chapterRangeMatch = currentPhasePlan.match(/【(.*?)】章节/);
  
  const targetEpisodes = episodeCountMatch ? (parseInt(episodeCountMatch[2]) - parseInt(episodeCountMatch[1]) + 1) : 6;
  const targetChapters = chapterRangeMatch ? chapterRangeMatch[1] : "对应章节";

  const prompt = `
    任务：执行第${phaseIndex}阶段的剧情脚本创作。
    
    【最高原则 - 严禁偏离原著】：
    1. 核心任务：你必须严格基于原著小说的【${targetChapters}】章节内容进行扩展。
    2. 数量约束：本阶段必须生成且只能生成【${targetEpisodes}】集脚本。
    3. 剧情一致性：台词、角色性格、物品、功法/招式必须与原著高度吻合。
    4. 爽剧节奏：符合2025年动漫爽剧节奏，单集2-3分钟，每集包含2-3个冲突爽点或悬念。
    5. 台词去小说化：删除“呜呜”、“嘤嘤”等仅适用于小说的语气词。
    
    【上下文参考】：
    - 历史全量剧情总结：${cumulativeSummary || '无（开篇阶段）'}
    - 本阶段执行指令：${currentPhasePlan}
    - 整体大纲参考：${outline} 

    【原著小说内容全量库】：
    ${novel}

    【输出格式要求】：
    1. 依次输出每一集。
    2. 在结尾输出“【递增式全量剧情总结】”。
  `;

  const response = await ai.chat.completions.create({
    model: "google/gemini-3-flash-Preview", 
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

/**
 * 第三部分：脚本润色
 */
export const polishScript = async (
  originalScript: string,
  kbContext: string
) => {
  const prompt = `
    你是一位专业的剧本精修师。请对以下剧情脚本进行“去AI化”处理。
    保证剧情一致性，优化自然语言，删除AI常用平庸词汇。
    知识库：${kbContext}

    待处理内容：
    ${originalScript}
  `;

  const response = await ai.chat.completions.create({
    model: "google/gemini-3-flash-Preview", 
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
};
