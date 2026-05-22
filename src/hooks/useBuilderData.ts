import { useEffect, useState } from "react";
import type { Advantage } from "@/types/advantages";
import type {
  ArchetypesData,
  SpecializationTreesData,
  StatsTalentsData,
} from "@/types/character";
import type { Power } from "@/types/powers";
import { publicAssetUrl } from "@/shared/utils/publicAssetUrl";

function fetchJson<T>(url: string) {
  return fetch(url).then((response) => response.json() as Promise<T>);
}

export function useBuilderData() {
  const [powers, setPowers] = useState<Power[]>([]);
  const [advantages, setAdvantages] = useState<Advantage[]>([]);
  const [archetypesData, setArchetypesData] = useState<ArchetypesData | null>(
    null,
  );
  const [statsTalentsData, setStatsTalentsData] =
    useState<StatsTalentsData | null>(null);
  const [specializationTreesData, setSpecializationTreesData] =
    useState<SpecializationTreesData | null>(null);

  useEffect(() => {
    fetchJson<Power[]>(publicAssetUrl("/data/powers.json")).then((data) => {
      setPowers(data);
    });
  }, []);

  useEffect(() => {
    fetchJson<Advantage[]>(publicAssetUrl("/data/advantages.json")).then(
      (data) => {
        setAdvantages(data);
      },
    );
  }, []);

  useEffect(() => {
    fetchJson<ArchetypesData>(publicAssetUrl("/data/archetypes.json")).then(
      (data) => {
        setArchetypesData(data);
      },
    );
  }, []);

  useEffect(() => {
    fetchJson<StatsTalentsData>(
      publicAssetUrl("/data/stats-talents.json"),
    ).then((data) => {
      setStatsTalentsData(data);
    });
  }, []);

  useEffect(() => {
    fetchJson<SpecializationTreesData>(
      publicAssetUrl("/data/specialization-trees.json"),
    ).then((data) => {
      setSpecializationTreesData(data);
    });
  }, []);

  return {
    advantages,
    archetypesData,
    dataReady:
      powers.length > 0 &&
      archetypesData !== null &&
      statsTalentsData !== null &&
      specializationTreesData !== null,
    powers,
    specializationTreesData,
    statsTalentsData,
  };
}
