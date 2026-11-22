export type Entry = {
  id: string; user_id: string; work_date: string; kind: 'extra' | 'holiday'; duration_minutes: number;
  is_paid: boolean; is_signed: boolean; notes: string; attachment_path: string | null; attachment_name: string | null;
  created_at: string; deleted_at: string | null;
}
