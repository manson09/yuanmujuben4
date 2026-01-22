import { OpenAI } from "openai";

const ai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, 
  baseURL: import.meta.env.VITE_BASE_URL,
  dangerouslyAllowBrowser: true, 
  defaultHeaders: {
    "HTTP-Referer": window.location.origin,
    "X-Title": "Script Matrix Agent", 
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
    【排版参考内容（你的唯一标准）】：
    ${formatRef || '按标准剧本格式，无特殊符号'}
    【原著内容】：
    ${novel}
  `;

  const response = await ai.chat.completions.create({
    model: "google/gemini-3-pro-preview", 
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
    
    【核心断点衔接指令 - 极其重要】：
    1. 请仔细查阅【历史全量剧情总结】中的最后一段话。那是上一阶段的【最后结局】。【历史全量剧情总结】中提到的所有具体情节、对话、冲突，在本阶段中属于“已发生禁区”。严禁在本阶段（第${phaseIndex}阶段）的开头重新演绎、复述或从头交代这些情节。你要做的是续写而不是重写
    2. 本阶段的第1集（即总第${episodeCountMatch ? episodeCountMatch[1] : 'N'}集）必须【紧接】上一阶段的结局直接开始续写。
    3. 【严禁重复】：严禁在本阶段开头重新交代、铺垫或复述上一阶段已经完成的剧情（如：如果上阶段已经打完架了，这一阶段严禁再从打架开始写）。
    4. 如果上一阶段已处理了原著第X章的部分内容，本阶段请直接从原著的下一章开始。
    

    【最高原则 - 严禁偏离原著】：
    1. 核心任务：你必须严格基于原著小说的【${targetChapters}】章节内容进行扩展。
    2. 数量约束：本阶段必须生成且只能生成【${targetEpisodes}】集脚本。
    3. 剧情一致性：台词、角色性格、物品、功法/招式必须与原著高度吻合。
    4. 爽剧节奏：符合2025年动漫爽剧节奏，单集2-3分钟，每集包含2-3个冲突爽点。
    5. 台词去小说化：删除“呜呜”、“嘤嘤”等语气词。

    【上下文参考】：
    - 历史全量剧情总结（已完成进度）：
    ${cumulativeSummary || '无（本阶段为开篇，请从头开始）'}
    
    - 整体大纲参考（全局路线）：
    ${outline} 

    - 本阶段执行指令：${currentPhasePlan}

    【原著小说内容全量库】：
    ${novel}
    【排版参考内容（你的唯一标准）】：
    ${formatRef || '按标准剧本格式，无特殊符号'}
    【输出格式要求】：
    1. 严格按照参考排版输出每一集。
    2. 在脚本最后一行输出“【递增式全量剧情总结】”，请在原有的总结基础上，增加本阶段新生成的详细剧情概括，形成新的全量总结。
  `;
  const response = await ai.chat.completions.create({
    model: "google/gemini-3-pro-preview", 
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
