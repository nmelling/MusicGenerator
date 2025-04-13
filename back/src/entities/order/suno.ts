import { HTTPException } from 'hono/http-exception';

async function request<TResponse>(
  url: string,
  config: RequestInit = {}
): Promise<TResponse> {
  const response = await fetch(url, config);
  return (await response.json()) as TResponse;
}

// https://docs.sunoapi.org/suno-api/generate-music
export async function $generateMusic(
  prompt: string,
  style: string,
  title: 'string'
) {
  const apiKey = Bun.env['SUNO_API_API_KEY'];
  if (!apiKey) throw new HTTPException(400, { message: 'MISSING_API_KEY' });

  const baseUrl = Bun.env['SUNO_API_BASE_URL'];
  if (!baseUrl) throw new HTTPException(400, { message: 'MISSING_BASE_URL' });

  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.append('Accept', 'application/json');
  myHeaders.append('Authorization', `Bearer ${apiKey}`);

  const raw = JSON.stringify({
    prompt,
    style,
    title,
    customMode: false,
    instrumental: false,
    model: 'V3_5',
    negativeTags: 'Heavy Metal, Upbeat Drums',
    callBackUrl: 'https://api.example.com/callback', // todo define
  });

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
  };

  try {
    await request(`${baseUrl}/generate`, requestOptions);
  } catch (err) {
    // todo: logger
    console.error(err);
  }
}
