import { Alert, Button } from 'antd';
export default function LoadError({ error, retry }: { error: string; retry: () => void }) {
  return error ? <Alert className="load-error" type="error" showIcon message={error} action={<Button onClick={retry}>Thử lại</Button>} /> : null;
}
