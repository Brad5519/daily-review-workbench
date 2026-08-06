import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { validateToken } from '@/lib/github-sync';
import { Cloud, Eye, EyeOff } from 'lucide-react';

const TOKEN_KEY = 'github_token';

export function FirstSetup() {
  const [showSetup, setShowSetup] = useState(false);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setShowSetup(true);
    }
  }, []);

  const handleSave = async () => {
    if (!token.trim()) return;
    setValidating(true);
    setError('');
    const result = await validateToken(token);
    if (result.success) {
      localStorage.setItem(TOKEN_KEY, token);
      setShowSetup(false);
    } else {
      setError(result.error || '验证失败');
    }
    setValidating(false);
  };

  if (!showSetup) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            配置云端同步
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            首次使用需要配置 GitHub Token 来启用数据云端同步。数据将存储在私有 Gist 中，只有你本人可以访问。
          </p>
          <div className="space-y-2">
            <Label>GitHub Personal Access Token</Label>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500">
            <p className="font-medium text-gray-700 mb-1">如何获取 Token？</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>打开 GitHub → Settings → Developer settings</li>
              <li>Personal access tokens → Tokens (classic)</li>
              <li>Generate new token，勾选 gist 权限</li>
              <li>复制生成的 Token 粘贴到上方</li>
            </ol>
          </div>
          <Button onClick={handleSave} disabled={validating} className="w-full">
            {validating ? '验证中...' : '保存并继续'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
