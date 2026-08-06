// 日常生活复盘工作台 - 类型定义

// 项目分类
export type ProjectCategory =
  | '运动健康'
  | '饮食管理'
  | '学习成长'
  | '兴趣技能'
  | '体征参数'
  | '自定义';

// 计量类型
export type MeasureType = '是否型' | '数值型' | '文本型';

// 项目类型
export type ProjectType = '目标型' | '记录型';

// 目标类型
export type TargetType = '下限型' | '上限型' | '区间型' | '无目标';

// 项目配置
export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  measureType: MeasureType;
  projectType: ProjectType;
  targetType: TargetType;
  unit: string;
  targetValue?: number;
  targetMin?: number;
  targetMax?: number;
  cardColor: string;
  sort: number;
  enabled: boolean;
  placeholder?: string;
}

// 每日记录
export interface DailyRecord {
  projectId: string;
  date: string; // YYYY-MM-DD
  value: boolean | number | string | null;
  note?: string;
}

// 日期数据
export interface DateData {
  date: string;
  records: Record<string, DailyRecord>; // projectId -> DailyRecord
  note: string;
}

// 应用数据
export interface AppData {
  projects: Project[];
  records: Record<string, DateData>; // date -> DateData
  lastSync?: string;
}

// 项目完成状态
export interface ProjectStatus {
  project: Project;
  record: DailyRecord | null;
  isCompleted: boolean;
  isOverLimit?: boolean;
  currentValue?: number | string;
  targetValue?: number;
  progress?: number;
}

// 分类颜色映射
export const CATEGORY_COLORS: Record<ProjectCategory, string> = {
  '运动健康': '#22c55e', // green-500
  '饮食管理': '#f97316', // orange-500
  '学习成长': '#3b82f6', // blue-500
  '兴趣技能': '#a855f7', // purple-500
  '体征参数': '#eab308', // yellow-500
  '自定义': '#ec4899', // pink-500
};

// 预置标签
export const PRESET_TAGS = ['#聚餐', '#失眠', '#加班', '#生理期', '#cheatday', '#生病'];

// 快捷累加值
export const QUICK_ADD_VALUES: Record<string, number[]> = {
  '喝水量': [250, 500],
  '钢琴练习': [10, 30],
  '拍一段视频': [5, 10],
  '减脂时间': [10, 20],
  '增肌时间': [10, 20],
  '练字': [1, 5],
};
