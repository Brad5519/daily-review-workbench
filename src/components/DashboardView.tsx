import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, AlertCircle, Coins, Calendar, Flame, Sparkles } from 'lucide-react';
import type { AppData, Project, ProjectCategory, DailyRecord } from '@/types';
import { CATEGORY_COLORS, DAILY_QUOTES } from '@/types';
import { getProjectStatus, checkConsecutiveMissing, checkConsecutiveFailed, groupProjectsByCategory } from '@/lib/utils-project';
import { getDateData } from '@/lib/storage';
import { calculateStreak, calculateMonthCompletedDays } from '@/lib/stats-utils';

interface DashboardViewProps {
  data: AppData;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onJumpToStats?: () => void;
}

export function DashboardView({ data, selectedDate, onDateChange, onJumpToStats }: DashboardViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const enabledProjects = useMemo(() => {
    return data.projects.filter((p) => p.enabled).sort((a, b) => a.sort - b.sort);
  }, [data.projects]);

  const groupedProjects = useMemo(() => {
    return groupProjectsByCategory(enabledProjects);
  }, [enabledProjects]);

  const todayData = useMemo(() => getDateData(data.records, selectedDate), [data.records, selectedDate]);
  const yesterdayData = useMemo(() => getDateData(data.records, yesterday), [data.records]);

  const getProjectRecord = (projectId: string, dateData: { records: Record<string, DailyRecord> }) => {
    return dateData.records[projectId] || null;
  };

  const calculateStats = (dateStr: string, dateData: { records: Record<string, DailyRecord> }) => {
    let completed = 0;
    let total = 0;

    enabledProjects.forEach((project) => {
      const record = getProjectRecord(project.id, dateData);
      const status = getProjectStatus(project, record);
      total++;
      if (status.isCompleted) completed++;
    });

    return { completed, total, reward: completed * 3 };
  };

  const todayStats = useMemo(() => calculateStats(selectedDate, todayData), [selectedDate, todayData, enabledProjects]);
  const yesterdayStats = useMemo(() => calculateStats(yesterday, yesterdayData), [yesterday, yesterdayData, enabledProjects]);

  const unrecordedCount = useMemo(() => {
    return enabledProjects.filter((p) => {
      const record = getProjectRecord(p.id, todayData);
      return !record || record.value === null;
    }).length;
  }, [enabledProjects, todayData]);

  const toggleCategory = (category: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategories(newSet);
  };

  const getCardBorderColor = (project: Project) => {
    const record = getProjectRecord(project.id, todayData);
    const isMissing2Days = checkConsecutiveMissing(data.records, project.id, selectedDate, 2);
    const isMissing3Days = checkConsecutiveMissing(data.records, project.id, selectedDate, 3);
    const isFailed3Days = checkConsecutiveFailed(data.records, project, selectedDate, 3);

    if (isFailed3Days || isMissing3Days) return 'border-red-400 ring-2 ring-red-100';
    if (isMissing2Days) return 'border-yellow-400 ring-2 ring-yellow-100';
    return 'border-transparent';
  };

  const renderProjectCard = (project: Project) => {
    const record = getProjectRecord(project.id, todayData);
    const status = getProjectStatus(project, record);
    const categoryColor = CATEGORY_COLORS[project.category];
    const borderClass = getCardBorderColor(project);
    const streak = calculateStreak(project, data.records, selectedDate === today);

    return (
      <Card
        key={project.id}
        className={`rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ${borderClass}`}
        style={{ borderLeftWidth: '4px', borderLeftColor: categoryColor }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{project.name}</h3>
              <p className="text-xs text-gray-500">{project.category}</p>
            </div>
            <div className="flex items-center gap-1">
              <StreakBadge streak={streak} categoryColor={categoryColor} />
              {status.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>
          </div>

          <div className="mt-3">
            {project.projectType === '记录型' ? (
              <div className="flex items-center gap-2">
                {status.isCompleted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">已完成</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-5 h-5 text-gray-300" />
                    <span className="text-sm text-gray-400">未完成</span>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={status.isCompleted ? 'text-green-600 font-medium' : 'text-gray-600'}>
                    {status.currentValue !== undefined ? status.currentValue : '-'}
                    {project.unit}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {project.targetType === '区间型'
                      ? `${project.targetMin}-${project.targetMax}${project.unit}`
                      : `${project.targetValue}${project.unit}`}
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={status.progress || 0}
                    className="h-2"
                    style={{
                      backgroundColor: '#e5e7eb',
                    }}
                  />
                  <div
                    className="absolute top-0 left-0 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, status.progress || 0)}%`,
                      backgroundColor: status.isOverLimit ? '#ef4444' : categoryColor,
                    }}
                  />
                </div>
                {status.isOverLimit && (
                  <p className="text-xs text-red-500">已超标</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const categories = Object.keys(groupedProjects) as ProjectCategory[];
  const shouldCollapse = enabledProjects.length > 8;

  // 计算本月概览
  const monthStats = useMemo(() => calculateMonthCompletedDays(enabledProjects, data.records), [enabledProjects, data.records]);

  // 连续打卡徽章组件
  const StreakBadge = ({ streak, categoryColor }: { streak: number; categoryColor: string }) => {
    if (streak === 0) return null;
    const isLongStreak = streak >= 7;
    const bgColor = categoryColor;
    return (
      <div
        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-white text-xs font-medium ${
          isLongStreak ? 'animate-pulse' : ''
        }`}
        style={{ backgroundColor: bgColor }}
      >
        <Flame size={isLongStreak ? 14 : 12} />
        <span>{isLongStreak ? '7+' : streak}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 日期选择 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border-none outline-none text-sm"
          />
        </div>
        {selectedDate === today && unrecordedCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4" />
            还有 {unrecordedCount} 项未记录
          </div>
        )}
      </div>

      {/* 本月概览快捷入口 */}
      <Card
        className="rounded-2xl shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 cursor-pointer hover:shadow-md transition-all"
        onClick={onJumpToStats}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">本月概览</p>
              <p className="text-lg font-bold text-gray-900">
                已完成 {monthStats.completed} 天 / 共 {monthStats.total} 天
              </p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400 rotate-[-90deg]" />
        </CardContent>
      </Card>

      {/* 奖惩总览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Coins className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{selectedDate === today ? '今日' : selectedDate} 奖惩</p>
                <p className="text-2xl font-bold text-gray-900">
                  达标 {todayStats.completed} 项，预计奖励 {todayStats.reward} 铜板
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Coins className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">昨日奖惩</p>
                <p className="text-2xl font-bold text-gray-900">
                  达标 {yesterdayStats.completed} 项，实际奖励 {yesterdayStats.reward} 铜板
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 项目卡片列表 */}
      <div className="space-y-4">
        {categories.map((category) => {
          const projects = groupedProjects[category];
          const isExpanded = expandedCategories.has(category);
          const categoryColor = CATEGORY_COLORS[category];

          return (
            <div key={category} className="space-y-3">
              {shouldCollapse ? (
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <span className="font-semibold text-gray-900">{category}</span>
                    <span className="text-sm text-gray-500">({projects.length}项)</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <span className="font-semibold text-gray-900">{category}</span>
                  <span className="text-sm text-gray-500">({projects.length}项)</span>
                </div>
              )}

              {(!shouldCollapse || isExpanded) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {projects.map(renderProjectCard)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
