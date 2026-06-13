export type Advantage = {
  advantage_id: number;
  name: string;
  points_cost: number | null;
  tooltip: string | null;
  damage_type?: string[] | string | null;
  damage_types?: string[] | string | null;
  apply_tag?: string[] | string | null;
  refresh_tag?: string[] | string | null;
  synergy_tag?: string[] | string | null;
  filter_tag?: string[] | string | null;
};
