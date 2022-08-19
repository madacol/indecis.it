import { getEndorsements } from "./endorsements";
import { Property } from "csstype";
import Color = Property.Color;

export interface ItemData {
  id: number;
  category_id: number;
  category: string;
  description: string;
  endorsement: string;
  subject: string;
  subject_slug: string;
  list: string;
  list_id: number;
  source_title: string;
}

export interface Item extends Omit<ItemData, "endorsement"> {
  endorsement?: Color;
}

export type Items = Record<ItemData["subject_slug"], Item[]>;
export type Topics = Record<ItemData["subject_slug"], ItemData["subject"]>;

export const getRawItems = (() => {
  let items: ItemData[] = [];
  return async () => {
    if (!items.length) {
      items = await fetch(
        "https://raw.githubusercontent.com/indecis-it/data/4868ec0d41812b1e857f9b375e14678dc90b76b6/data/items.json"
      ).then((response) => response.json());
    }
    return items;
  };
})();

export const getTopics = (() => {
  let names: Topics | null = null;
  return async () => {
    if (!names) {
      names = (await getRawItems()).reduce((acc: Topics, content) => {
        const { subject_slug } = content;
        const current = acc[subject_slug];
        if (!subject_slug || current) {
          return acc;
        }
        return { ...acc, [subject_slug]: content.subject };
      }, {});
    }
    return names;
  };
})();

export const getItems = async (id: ItemData["category_id"]) => {
  if (!id) {
    return {};
  }
  const endorsements = await getEndorsements();
  const contents = (await getRawItems())
    .filter(({ category_id }) => category_id === id)
    .sort((a, b) => a.list_id - b.list_id);
  return contents.reduce((acc: Items, content) => {
    const { subject_slug } = content;
    const current = acc[subject_slug] || [];
    if (!subject_slug) {
      return acc;
    }
    const endorsement = endorsements.find((endorsement) =>
      content.endorsement.includes(endorsement.icon)
    );
    return {
      ...acc,
      [subject_slug]: [
        ...current,
        { ...content, endorsement: endorsement?.color_code },
      ],
    };
  }, {});
};
