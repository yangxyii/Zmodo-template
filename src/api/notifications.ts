import { postForm } from './http';

export interface AiNotification {
  people_motion: number;
  vehicle_motion: number;
  animal_motion: number;
  other_motion: number;
}

export async function getAiNotification(token: string): Promise<AiNotification> {
  const r = await postForm<any>('app_access', '/mode/user_config_get', { token });
  const ai = (r as any).ai_notification ?? {};
  return {
    people_motion: ai.people_motion ?? 0,
    vehicle_motion: ai.vehicle_motion ?? 0,
    animal_motion: ai.animal_motion ?? 0,
    other_motion: ai.other_motion ?? 0,
  };
}

export async function setAiNotification(token: string, ai: AiNotification): Promise<void> {
  await postForm('app_access', '/mode/user_config_set', {
    token,
    ai_notification: JSON.stringify(ai),
  });
}
