import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { exportData, importData, clearData, initData } from '@/lib/storage';
import { exportToObsidian, type ExportRange } from '@/lib/obsidian-export';
import { createBackup } from '@/lib/backup';
import type { AppData } from '@/types';
import { Download, Upload, Trash2, Database, FileJson, Calendar, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SettingsViewProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
}

export function SettingsView({ data, onDataChange }: SettingsViewProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [exportRange, setExportRange] = useState<ExportRange>('全部');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obsidian 导出
  const handleObsidianExport = async () => {
    // 先创建本地备份
    createBackup(data);
    // 生成并下载
    await exportToObsidian(data, exportRange);
  };

  // 计算统计数据
  const projectCount = data.projects.length;
  const recordDays = Object.keys(data.records).length;
  const totalRecords = Object.values(data.records).reduce(
    (sum, day) => sum + Object.keys(day.records).length,
    0
  );

  // 导出数据
  const handleExport = () => {
    const json = exportData(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-review-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 选择文件
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportContent(content);
      setImportDialogOpen(true);
    };
    reader.readAsText(file);
  };

  // 确认导入
  const handleImportConfirm = () => {
    try {
      // 导入前自动创建备份
      createBackup(data);
      const newData = importData(importContent);
      onDataChange(newData);
      setImportDialogOpen(false);
      setImportContent('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (e) {
      alert('导入失败：文件格式不正确');
    }
  };

  // 确认清空
  const handleClearConfirm = () => {
    if (clearConfirmText === '确认清空') {
      clearData();
      onDataChange(initData());
      setClearDialogOpen(false);
      setClearConfirmText('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">数据管理</h2>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 flex flex-col items-center">
            <FileJson className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{projectCount}</p>
            <p className="text-sm text-gray-600">项目数量</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 flex flex-col items-center">
            <Calendar className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{recordDays}</p>
            <p className="text-sm text-gray-600">记录天数</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 flex flex-col items-center">
            <Database className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
            <p className="text-sm text-gray-600">总记录条数</p>
          </CardContent>
        </Card>
      </div>

      {/* 数据操作 */}
      <Card>
        <CardHeader>
          <CardTitle>数据操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 导出 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">导出数据</h3>
              <p className="text-sm text-gray-500">下载所有项目配置和记录为 JSON 文件</p>
            </div>
            <Button onClick={handleExport} className="gap-2">
              <Download size={16} />
              导出
            </Button>
          </div>

          {/* 导入 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">导入数据</h3>
              <p className="text-sm text-gray-500">从 JSON 文件恢复数据（将覆盖现有数据）</p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload size={16} />
                选择文件
              </Button>
            </div>
          </div>

          {/* Obsidian 导出 */}
          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div>
              <h3 className="font-medium text-indigo-900">导出为 Obsidian 日记</h3>
              <p className="text-sm text-indigo-600">生成 Markdown 格式日记文件</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={exportRange} onValueChange={(v) => setExportRange(v as ExportRange)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部</SelectItem>
                  <SelectItem value="本月">本月</SelectItem>
                  <SelectItem value="上周">上周</SelectItem>
                  <SelectItem value="自定义">自定义</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleObsidianExport} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <FileText size={16} />
                导出
              </Button>
            </div>
          </div>

          {/* 清空 */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <h3 className="font-medium text-red-900">清空数据</h3>
              <p className="text-sm text-red-600">删除所有数据，此操作不可恢复</p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setClearDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 size={16} />
              清空
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 导入确认对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认导入数据</DialogTitle>
            <DialogDescription>
              导入将覆盖当前所有数据，此操作不可撤销。是否继续？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleImportConfirm}>确认导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清空确认对话框 */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认清空数据</DialogTitle>
            <DialogDescription>
              此操作将删除所有数据且不可恢复。请输入"确认清空"以继续。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="clear-confirm">确认文本</Label>
            <Input
              id="clear-confirm"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="输入：确认清空"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearConfirm}
              disabled={clearConfirmText !== '确认清空'}
            >
              确认清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
