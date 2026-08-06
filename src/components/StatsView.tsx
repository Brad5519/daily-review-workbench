import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, ChevronDown, ChevronUp } from 'lucide-react';
import type { AppData, Project, ProjectCategory } from '@/types';
import { CATEGORY_COLORS } from '@/types';
import type { TimeRange } from '@/lib/stats-utils';
import {
  getDateRange,
  getWeekDates,
  getProjectCompletionStatus,
  calculateStreak,
  calculateDayCompletion,
  getCompletionColor,
  calculateMonthStats,
  calculateNumericTrend,
  getMonthCalendar,
} from '@/lib/stats-utils';
import { groupProjectsByCategory } from '@/lib/utils-project';
import { checkProjectCompleted } from '@/lib/utils-project';

interface StatsViewProps {
  data: AppData;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onDateSelect: (date: string) => void;
}

const TIME_RANGES: TimeRange[] = ['近7天', '本周', '上周', '本月', '上月'];

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function StatsView({ data, timeRange, onTimeRangeChange, onDateSelect }: StatsViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const today = new Date().toISOString().split('T')[0];

  const enabledProjects = useMemo(
    () => data.projects.filter((p) => p.enabled).sort((a, b) => a.sort - b.sort),
    [data.projects]
  );

  const groupedProjects = useMemo(() => groupProjectsByCategory(enabledProjects), [enabledProjects]);
  const categories = Object.keys(groupedProjects) as ProjectCategory[];

  const weekDates = useMemo(() => getWeekDates(today), [today]);
  const dateRange = useMemo(() => getDateRange(timeRange), [timeRange]);

  const showHeatmap = timeRange === '本月' || timeRange === '上月';
  const showTrendCards = timeRange === '近7天' || timeRange === '本周' || timeRange === '上周';

  const numericProjects = useMemo(
    () => enabledProjects.filter((p) => p.measureType === '数值型'),
    [enabledProjects]
  );

  const toggleCategory = (category: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategories(newSet);
  };

  const renderStatusDot = (status: 'completed' | 'incomplete' | 'unrecorded') => {
    if (status === 'completed') {
      return <div className="w-3 h-3 rounded-full bg-green-500" />;
    }
    if (status === 'incomplete') {
      return <div className="w-3 h-3 rounded-full bg-gray-300" />;
    }
    return <div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-300" />;
  };

  const streakList = useMemo(() => {
    return enabledProjects
      .map((project) => {
        const streak = calculateStreak(project, data.records, true);
        return { project, streak };
      })
      .filter((item) => item.streak > 0)
      .sort((a, b) => b.streak - a.streak);
  }, [enabledProjects, data.records]);

  const heatmapData = useMemo(() => {
    if (!showHeatmap) return null;
    const year = parseInt(dateRange.start.split('-')[0]);
    const month = parseInt(dateRange.start.split('-')[1]) - 1;
    const calendar = getMonthCalendar(year, month);
    const { dailyCompletion, averageCompletion } = calculateMonthStats(
      data.projects,
      data.records,
      year,
      month
    );
    return { calendar, dailyCompletion, averageCompletion };
  }, [showHeatmap, dateRange, data.projects, data.records]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">统计回顾</h2>

      {/* 时间段选择器 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TIME_RANGES.map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTimeRangeChange(range)}
            className="whitespace-nowrap"
          >
            {range}
          </Button>
        ))}
      </div>

      {/* 周视图表格 */}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">周视图</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left p-2 text-sm font-medium text-gray-500">项目</th>
                  {weekDates.map((date) => (
                    <th
                      key={date}
                      className={`p-2 text-center text-sm font-medium ${
                        date === today ? 'text-blue-600 bg-blue-50 rounded-lg' : 'text-gray-500'
                      }`}
                    >
                      {WEEK_DAYS[new Date(date).getDay() === 0 ? 6 : new Date(date).getDay() - 1]}
                      <div className="text-xs">{date.slice(5)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const projects = groupedProjects[category];
                  const isExpanded = expandedCategories.has(category);
                  const categoryColor = CATEGORY_COLORS[category];

                  return (
                    <>
                      <tr
                        key={category}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleCategory(category)}
                      >
                        <td colSpan={8} className="p-2">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: categoryColor }}
                            />
                            <span className="font-medium text-gray-900">{category}</span>
                            <span className="text-sm text-gray-500">({projects.length})</span>
                          </div>
                        </td>
                      </tr>
                      {isExpanded &&
                        projects.map((project) => (
                          <tr key={project.id} className="border-t border-gray-100">
                            <td className="p-2 text-sm text-gray-700 pl-8">{project.name}</td>
                            {weekDates.map((date) => {
                              const status = getProjectCompletionStatus(project, data.records, date);
                              return (
                                <td key={date} className="p-2 text-center">
                                  <button
                                    onClick={() => onDateSelect(date)}
                                    className="inline-flex items-center justify-center p-1 hover:bg-gray-100 rounded"
                                  >
                                    {renderStatusDot(status)}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 连续打卡天数榜 */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            连续打卡榜
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {streakList.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无连续打卡记录</p>
            ) : (
              streakList.map(({ project, streak }) => {
                const categoryColor = CATEGORY_COLORS[project.category];
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryColor }}
                      />
                      <span className="font-medium text-gray-900">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 font-bold">连续 {streak} 天</span>
                      <Flame
                        className={`text-orange-500 ${streak > 7 ? 'w-6 h-6' : 'w-4 h-4'}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* 月度热力图 */}
      {showHeatmap && heatmapData && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">月度完成度热力图</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                <div key={d} className="text-center text-xs text-gray-500 py-1">
                  {d}
                </div>
              ))}
              {heatmapData.calendar.map((item, idx) => {
                if (!item.date) {
                  return <div key={idx} className="aspect-square" />;
                }
                const completion = heatmapData.dailyCompletion[item.date] || 0;
                const color = getCompletionColor(completion, '#3b82f6');
                const isToday = item.date === today;

                return (
                  <button
                    key={item.date}
                    onClick={() => onDateSelect(item.date)}
                    className={`aspect-square rounded-lg transition-all hover:scale-110 ${
                      isToday ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={`${item.date} 完成度 ${completion}%`}
                  />
                );
              })}
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              本月日均完成度 {heatmapData.averageCompletion}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* 数值型趋势卡片 */}
      {showTrendCards &&
        numericProjects.map((project) => {
          const trend = calculateNumericTrend(project, data.records, 7);
          const maxValue = project.targetValue || trend.values.filter((v) => v !== null).reduce((a, b) => Math.max(a || 0, b || 0), 0) || 100;

          return (
            <Card key={project.id} className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[project.category] }}
                  />
                  {project.name}
                  {project.unit && <span className="text-gray-500 text-sm">({project.unit})</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-end gap-1 h-32 mb-4">
                  {trend.values.map((value, idx) => {
                    const height = value ? Math.min(100, (value / maxValue) * 100) : 0;
                    const isCompleted = value !== null && checkProjectCompleted(project, { projectId: project.id, date: trend.dates[idx], value });

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t transition-all"
                          style={{
                            height: `${height}%`,
                            backgroundColor: isCompleted ? CATEGORY_COLORS[project.category] : '#e5e7eb',
                            minHeight: value ? '4px' : '0',
                          }}
                        />
                        <span className="text-xs text-gray-500">{trend.dates[idx].slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>日均值: {trend.average}</span>
                  <span>达标天数: {trend.达标天数}/7</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
