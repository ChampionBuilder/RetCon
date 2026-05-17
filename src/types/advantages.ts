export type Advantage = {
  advantage_id: number;
  name: string;
  points_cost: number | null;
  dependency_advantage_id: number | null;
  tooltip: string | null;
};