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
    你是一位资深的动漫爽剧编剧，极其擅长挖掘并输出原著小说精华各个爽点爆点部分。请根据以下原著内容，分析并创作一份深度故事大纲。
    
    【核心要求】：
    1. 风格：符合2025年最火的动漫爽剧节奏，${mode === 'male' ? '男频（热血、升级、打脸、称霸）' : '女频（虐恋、重生、复仇、团宠）'}风格。
    2. 字数：2000-3000字深度大纲，涵盖起承转合。
    3. 阶段规划（核心）：你必须将全剧划分为若干阶段。每个阶段5-9集。完本70-85集，单集2-3分钟内容量.
       格式必须严格遵循以下示例：
       第1阶段：[1-6]集，原著【1-12】章节，核心爽点总结：[描述]
                第1集，原著【1-2】章节，单集核心爽点总结:[描述]
                第2集,原著【3】章节，单集核心爽点总结:[描述]
       第2阶段：[7-15]集，原著【13-25】章节，核心爽点：[描述]
    4.禁止增加原著没有的剧情，禁止增加原著没有的人物、道具等等。
    5. 排版参考：${formatRef || '标准剧本大纲排版'}
    6. 文笔参考：${styleRef || '分析写法、用词习惯、节奏分配'}
    7. 【集数规划指标】：
       - 每 1 个阶段（5-9集）必须覆盖原著中 1-2 个完整的核心小高潮。
       - 严禁在一个阶段内大幅度跨越原著章节却没写出任何细节对白。
       
    【重要指令】：
    在大纲正文结束后，请务必以“【阶段详细规划开始】”和“【阶段详细规划结束】”为标记，列出具体的阶段计划。
    你必须根据原著内容，明确指出每个阶段对应原著的章节范围。

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
    
   【！！！本阶段制作圣经：分集指令地图！！！】
    ${currentPhasePlan} 

    【最高原则 - 工业级精准执行】：
    1. 【核准地图执行】：你必须严格按照上方“分集指令地图”中规定的【每集】与【原著章节】的对应关系进行创作。
    2. 【单集内容锁死】：当你编写第N集时，你的素材来源【必须且只能】是该集对应的原著章节。
       - 严禁抢戏：禁止在第N集写出后续集数规划中的情节。
       - 严禁漏戏：必须完整提取该集对应章节中的所有精华冲突和爽点，严禁一笔带过。
    3. 【剧情强一致性】：角色性格、物品、功法/招式必须与原著高度吻合。
    5. 【台词去小说化】：彻底剔除“呜呜”、“嘤嘤”、“桀桀”等网文冗余词，转化为更具动漫感更待爽感的硬核台词。

    【上下文参考】：
    - 历史全量剧情总结（已完成进度）：
    ${cumulativeSummary || '无（本阶段为开篇，请从头开始）'}

    【高信息量创作指令】：
    1. 拒绝流水账：严禁使用“一个月后”、“三天后”这种类型跳跃式句子。
    
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
