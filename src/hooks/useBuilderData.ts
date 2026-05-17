import { useEffect, useState } from "react";
import type { Advantage } from "../types/advantages";
import type {
  ArchetypesData,
  SpecializationTreesData,
  StatsTalentsData,
} from "../types/character";
import type { Power } from "../types/powers";

function fetchJson<T>(url: string) {
  return fetch(url, { cache: "no-store" }).then(
    (response) => response.json() as Promise<T>,
  );
}

function dataUrl(fileName: string) {
  return `${import.meta.env.BASE_URL}data/${fileName}`;
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
    fetchJson<Power[]>(dataUrl("powers.json")).then((data) => {
      setPowers(data);
    });
  }, []);

  useEffect(() => {
    fetchJson<Advantage[]>(dataUrl("advantages.json")).then((data) => {
      setAdvantages(data);
    });
  }, []);

  useEffect(() => {
    fetchJson<ArchetypesData>(dataUrl("archetypes.json")).then((data) => {
      setArchetypesData(data);
    });
  }, []);

  useEffect(() => {
    fetchJson<StatsTalentsData>(dataUrl("stats-talents.json")).then((data) => {
      setStatsTalentsData(data);
    });
  }, []);

  useEffect(() => {
    fetchJson<SpecializationTreesData>(
      dataUrl("specialization-trees.json"),
    ).then(
      (data) => {
        setSpecializationTreesData(data);
      },
    );
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
