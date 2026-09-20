import type { CloudProfile, CloudRepository, CloudSave, DeviceRegistration } from '../backend/contracts';
import { cloudRequest, type SupabaseCloudConfig, type SupabaseSession } from './http';

type CloudSaveRow = {
  user_id: string; schema_version: number; revision: number;
  device_install_id: string | null; payload: unknown; updated_at: string;
};

function saveFromRow<T>(row: CloudSaveRow): CloudSave<T> {
  return { userId: row.user_id, schemaVersion: row.schema_version, revision: row.revision,
    deviceId: row.device_install_id ?? 'unknown', data: row.payload as T, updatedAt: row.updated_at };
}

export class SupabaseCloudRepository<T> implements CloudRepository<T> {
  constructor(private config: SupabaseCloudConfig, private session: SupabaseSession) {}

  async getProfile(userId: string): Promise<CloudProfile | null> {
    const rows = await cloudRequest<any[]>(this.config, this.session,
      `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,display_name,locale,created_at,updated_at`);
    const row = rows[0];
    return row ? { userId: row.id, displayName: row.display_name ?? 'GRACZ', locale: row.locale ?? 'pl-PL',
      region: 'PL', timezone: 'UTC', createdAt: row.created_at, updatedAt: row.updated_at } : null;
  }

  async upsertProfile(profile: CloudProfile): Promise<void> {
    await cloudRequest(this.config, this.session, '/rest/v1/profiles?on_conflict=id', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: profile.userId, display_name: profile.displayName, locale: profile.locale, updated_at: profile.updatedAt }),
    });
  }

  async registerDevice(userId: string, device: DeviceRegistration): Promise<void> {
    await cloudRequest(this.config, this.session, '/rest/v1/user_devices?on_conflict=user_id,install_id', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_id: userId, install_id: device.deviceId, platform: device.platform,
        app_version: device.appVersion, last_seen_at: device.lastSeenAt,
        capabilities: { locale: device.locale, timezone: device.timezone, pushToken: Boolean(device.pushToken) } }),
    });
  }

  async pullSave(userId: string): Promise<CloudSave<T> | null> {
    const rows = await cloudRequest<CloudSaveRow[]>(this.config, this.session,
      `/rest/v1/cloud_saves?user_id=eq.${encodeURIComponent(userId)}&select=*`);
    return rows[0] ? saveFromRow<T>(rows[0]) : null;
  }

  async pushSave(save: CloudSave<T>, expectedRevision = save.revision): Promise<CloudSave<T>> {
    const rows = await cloudRequest<CloudSaveRow[]>(this.config, this.session, '/rest/v1/rpc/push_cloud_save', {
      method: 'POST',
      body: JSON.stringify({ p_expected_revision: expectedRevision, p_schema_version: save.schemaVersion,
        p_device_install_id: save.deviceId, p_payload: save.data }),
    });
    const row = Array.isArray(rows) ? rows[0] : rows as unknown as CloudSaveRow;
    return saveFromRow<T>(row);
  }

  async deleteUserData(userId: string): Promise<void> {
    await cloudRequest(this.config, this.session,
      `/rest/v1/cloud_saves?user_id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE' });
  }
}
