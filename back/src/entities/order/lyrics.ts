import Anthropic from '@anthropic-ai/sdk';
import { HTTPException } from 'hono/http-exception';
import {
  type LyricsPayload,
  type GenerateNewLyricsPartPayload,
  lyricsPayloadSchema,
  generateNewLyricsPartPayloadSchema,
} from './validation';

async function anthropicPromiseWrapper(
  systemPrompt: string,
  userPrompt: string
) {
  const apiKey = Bun.env['ANTHROPIC_API_KEY'];
  if (!apiKey) throw new HTTPException(400, { message: 'MISSING_API_KEY' });

  const anthropic = new Anthropic({ apiKey });

  return anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    temperature: 0,
    system: `
      ${systemPrompt}
      Sépare chaque partie de la chanson (prompt suno, intro, couplet, refrain) par '\n\n'. Assure toi que chaque partie de type 'Couplet', 'Refrain', etc commence bien par [VERSE/CHORUS/INTRO/OUTRO/...]
    `,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt,
          },
        ],
      },
    ],
  });
}

export async function $generateLyrics(payload: LyricsPayload): Promise<string> {
  const { success } = lyricsPayloadSchema.safeParse(payload);
  if (!success)
    throw new HTTPException(400, { message: 'INCORRECT_PAYLOAD_PROVIDED' });

  let generatedLyrics = '';
  try {
    const userPrompt = `
      Tu trouveras ici les précisions concernant la chanson à générer :
      ${payload.musicPrompt}
      ${payload.answers
        .map((item) => `${item.prompt}: ${item.answer}`)
        .join('\n')}
    `;

    const message: Anthropic.Message = await anthropicPromiseWrapper(
      payload.systemPrompt,
      userPrompt
    );

    const responseContent = message.content[0];
    if ('text' in responseContent && typeof responseContent.text === 'string')
      generatedLyrics = responseContent.text;
  } catch (err) {
    // todo logger
    if (err instanceof HTTPException) throw err;
    throw new HTTPException(400, { message: 'LYRICS_GENERATION_ERROR' });
  }

  return generatedLyrics;
}

export type ExtractedLyricParts = {
  sunoPrompt: string;
  verses: string[];
  refrain: string;
  layout: string[];
};

export function $extractLyricParts(lyrics: string): ExtractedLyricParts {
  if (!lyrics) throw new HTTPException(400, { message: 'NO_LYRICS_PROVIDED' });
  if (typeof lyrics !== 'string')
    throw new HTTPException(400, { message: 'WRONG_LYRICS_FORMAT' });

  const extracted: ExtractedLyricParts = {
    sunoPrompt: '',
    verses: [],
    refrain: '',
    layout: [],
  };

  const splitted = lyrics.split('\n\n');
  if (splitted.length === 1 && splitted[0] === lyrics) return extracted;

  for (const str of splitted) {
    const lowered = str.toLowerCase();
    if (lowered.includes('suno') && !extracted.sunoPrompt)
      extracted.sunoPrompt = str;

    const layoutIdentifier = str.match(/(\[\w*\s*\w*\])/i)?.[0];
    if (!layoutIdentifier) continue;

    extracted.layout.push(layoutIdentifier);
    if (layoutIdentifier.toLowerCase().includes('chorus')) {
      extracted.refrain = str;
      continue;
    }
    extracted.verses.push(str);
  }

  return extracted;
}

export async function $generateNewLyricsPart(
  payload: GenerateNewLyricsPartPayload
) {
  const { success } = generateNewLyricsPartPayloadSchema.safeParse(payload);
  if (!success)
    throw new HTTPException(400, { message: 'INCORRECT_PAYLOAD_PROVIDED' });

  let generatedLyrics = '';
  try {
    const userPrompt = `
      Voici le prompt initial pour la génération de la musique :
      ${payload.musicPrompt}
      ${payload.answers
        .map((item) => `${item.prompt}: ${item.answer}`)
        .join('\n')}

      Il faut que tu me génères uniquement les parties suivantes :
      ${payload.selectedParts?.join(', ')}
    `;

    const message: Anthropic.Message = await anthropicPromiseWrapper(
      payload.systemPrompt,
      userPrompt
    );

    const responseContent = message.content[0];
    if ('text' in responseContent && typeof responseContent.text === 'string')
      generatedLyrics = responseContent.text;
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    throw new HTTPException(400, { message: 'LYRICS_GENERATION_ERROR' });
  }

  return generatedLyrics;
}
