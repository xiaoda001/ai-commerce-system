import { Layout, Typography } from 'antd';

export default function App({ apiBaseUrl = 'http://127.0.0.1:3001' }: { apiBaseUrl?: string }) {
  return (
    <Layout>
      <Layout.Header>
        <Typography.Title level={1} style={{ color: 'white', margin: 0 }}>
          Commerce Admin
        </Typography.Title>
      </Layout.Header>
      <Layout.Content>
        <nav aria-label="Admin navigation">
          <a href="/">Home</a>
          <a href={`${apiBaseUrl.replace(/\/$/, '')}/health/live`}>API health</a>
        </nav>
      </Layout.Content>
    </Layout>
  );
}
