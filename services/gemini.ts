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
    任务：你是一位顶级的动漫爽剧架构师。请深度分析原著内容，制定一份精准的【分集执行地图】。
    
    【核心目标】：
    1. 风格定位：${mode === 'male' ? '男频（热血、升级、爆爽打脸）' : '女频（重生、复仇、极致拉扯）'}，符合2025年爽剧快节奏。
    2. 全量规模：总集数锁定在 70-85 集，单集 2-3 分钟内容量。
    3. 生成2000-3000字的深度剧本大纲.

        【核心逻辑要求】：
    1. **动态密度分析**：不要机械地划分章节。
       - 情节高潮、反转密集的章节，请放慢节奏（例如：原著1章对应剧本1集）。
       - 铺垫较多、注水严重的章节，请大幅度压缩（例如：原著5-8章压缩成剧本1集）。
    2. **全量覆盖**：必须覆盖原著提供的所有核心剧情，总集数最终控制在 70-85 集左右。

    【输出格式要求（这是系统解析的唯一标准）】：
    请务必将规划内容包裹在 【START_MAP】 和 【END_MAP】 之间。
    （以下数字仅为格式示例，请根据原著实际篇幅和密度自行分配）

    【START_MAP】
    第1阶段：[集数范围]集，对应原著【章节范围】章节，阶段核心：[本阶段目标]
    - 第n集：对应原著第x-y章，核心爽点：[描述本集高能时刻]
    - 第n+1集：对应原著第z章...
    
    第2阶段：...
    【END_MAP】

    【核心禁令】：
    1. 严禁跳过原著关键情节。
    2. 每一集的原著指向必须极其精确，这是后续生成脚本的唯一依据。
    
    【待分析原著内容】：
    ${novel}

    【排版/文笔参考】：
    排版标准：${formatRef || '标准剧本格式'}
    文笔风格：${styleRef || '快节奏、高张力'}

  `;

  const response = await ai.chat.completions.create({
    model: "google/gemini-3-pro-preview", 
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
  });

  return response.choices[0].message.content;
};

/**
 * 第二部分：剧情脚本功能（地图精准执行者）
 */
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
  // 提取本阶段的集数范围
  const episodeCountMatch = currentPhasePlan.match(/\[(\d+)-(\d+)\]集/);
  const startEp = episodeCountMatch ? episodeCountMatch[1] : "?";
  const endEp = episodeCountMatch ? episodeCountMatch[2] : "?";

  const prompt = `
    任务：你是剧本执行主笔，请精准执行【第${phaseIndex}阶段】的脚本创作。

    【唯一执行依据：分集指令地图】：
    ${currentPhasePlan}

    【！！！最高原则：工业级对齐指令！！！】：
    1. 【按图索骥】：本阶段你必须且只能生成从【第${startEp}集】到【第${endEp}集】的脚本。
    2. 【单集锁死】：
       - 严禁合并或跳过地图中的集数。
       - 每一集脚本的创作素材，必须【强制锁定】在地图标明的原著章节内。
       - 例如：地图标注第8集对应原著第14-15章，你写第8集时严禁看第16章的内容。
    3. 【禁止回溯与重复】：
       - 检查【历史全量进度总结】：${cumulativeSummary || '无'}。
       - 本阶段第一集必须紧接上一阶段的末尾，严禁重新交代已发生的剧情。
    4. 【高信息量还原】：
       - 将原著章节中的干货（对话、动作）进行影视化扩写。
       - 剔除“呜呜”、“嘤嘤”、“桀桀”等网文废词。
       - 确保单集时长撑满 2-3 分钟，信息密度极高。

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
