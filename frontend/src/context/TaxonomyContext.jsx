import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchTaxonomy,
  addTaxonomyCategory,
  addTaxonomySubcategory,
  deleteTaxonomyCategory,
  deleteTaxonomySubcategory,
  addTaxonomyLevel,
  deleteTaxonomyLevel,
  addTaxonomyHierarchyItem,
} from '../Api/Api';
import {
  COURSE_CATEGORIES_BY_TYPE as DEFAULT_COURSE_CATEGORIES_BY_TYPE,
  COURSE_LEVELS as DEFAULT_COURSE_LEVELS,
  INSTITUTE_TYPES as DEFAULT_INSTITUTE_TYPES,
  AFFILIATION_OPTIONS as DEFAULT_AFFILIATION_OPTIONS,
  PLATFORM_LOCATIONS as DEFAULT_PLATFORM_LOCATIONS,
} from '../constants/taxonomy';

const TaxonomyContext = createContext(null);

export function TaxonomyProvider({ children }) {
  const [hierarchy, setHierarchy] = useState(DEFAULT_COURSE_CATEGORIES_BY_TYPE);
  const [levels, setLevels] = useState(DEFAULT_COURSE_LEVELS);
  const [types, setTypes] = useState(DEFAULT_INSTITUTE_TYPES);
  const [affiliations, setAffiliations] = useState(DEFAULT_AFFILIATION_OPTIONS);
  const [locations, setLocations] = useState(DEFAULT_PLATFORM_LOCATIONS);
  const [loading, setLoading] = useState(true);

  const loadTaxonomy = useCallback(async () => {
    try {
      const res = await fetchTaxonomy();
      if (res) {
        if (res.course_hierarchy) setHierarchy(res.course_hierarchy);
        if (res.course_levels) setLevels(res.course_levels);
        if (res.institute_types) setTypes(res.institute_types);
        if (res.affiliations) setAffiliations(res.affiliations);
        if (res.locations) setLocations(res.locations);
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic taxonomy, using defaults:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTaxonomy();
  }, [loadTaxonomy]);

  // Unified Common Pool of categories and subcategories across all institute types
  const commonCategories = useMemo(() => {
    const pool = {};
    Object.values(hierarchy || {}).forEach((byType) => {
      if (typeof byType === 'object' && byType !== null) {
        Object.entries(byType).forEach(([cat, subs]) => {
          if (!pool[cat]) pool[cat] = [];
          if (Array.isArray(subs)) {
            subs.forEach((s) => {
              if (!pool[cat].includes(s)) pool[cat].push(s);
            });
          }
        });
      }
    });
    return pool;
  }, [hierarchy]);

  // Common pool getters: available to ANY institute regardless of type
  const courseCategoriesFor = useCallback(
    () => Object.keys(commonCategories),
    [commonCategories],
  );

  const courseSubcategoriesFor = useCallback(
    (typeOrCat, maybeCat) => {
      const cat = maybeCat || typeOrCat;
      return commonCategories[cat] || [];
    },
    [commonCategories],
  );

  const addCategory = async (instituteType, category, subcategories = []) => {
    const updated = await addTaxonomyCategory({ instituteType, category, subcategories });
    if (updated?.course_hierarchy) setHierarchy(updated.course_hierarchy);
    return updated;
  };

  const addSubcategory = async (instituteType, category, subcategory) => {
    const updated = await addTaxonomySubcategory({ instituteType, category, subcategory });
    if (updated?.course_hierarchy) setHierarchy(updated.course_hierarchy);
    return updated;
  };

  const deleteCategory = async (instituteType, category) => {
    const updated = await deleteTaxonomyCategory(instituteType, category);
    if (updated?.course_hierarchy) setHierarchy(updated.course_hierarchy);
    return updated;
  };

  const deleteSubcategory = async (instituteType, category, subcategory) => {
    const updated = await deleteTaxonomySubcategory(instituteType, category, subcategory);
    if (updated?.course_hierarchy) setHierarchy(updated.course_hierarchy);
    return updated;
  };

  const addLevel = async (level) => {
    const updated = await addTaxonomyLevel(level);
    if (updated?.course_levels) setLevels(updated.course_levels);
    return updated;
  };

  const deleteLevel = async (level) => {
    const updated = await deleteTaxonomyLevel(level);
    if (updated?.course_levels) setLevels(updated.course_levels);
    return updated;
  };

  const addHierarchyItem = async ({ instituteType, level, category, subcategories = [] }) => {
    const updated = await addTaxonomyHierarchyItem({ instituteType, level, category, subcategories });
    if (updated?.course_hierarchy) setHierarchy(updated.course_hierarchy);
    if (updated?.course_levels) setLevels(updated.course_levels);
    return updated;
  };

  const value = {
    loading,
    hierarchy,
    commonCategories,
    levels,
    types,
    affiliations,
    locations,
    courseCategoriesFor,
    courseSubcategoriesFor,
    addCategory,
    addSubcategory,
    deleteCategory,
    deleteSubcategory,
    addLevel,
    deleteLevel,
    addHierarchyItem,
    refreshTaxonomy: loadTaxonomy,
  };

  return <TaxonomyContext.Provider value={value}>{children}</TaxonomyContext.Provider>;
}

export function useTaxonomy() {
  const ctx = useContext(TaxonomyContext);
  if (!ctx) {
    // Graceful fallback if called outside provider
    return {
      hierarchy: DEFAULT_COURSE_CATEGORIES_BY_TYPE,
      levels: DEFAULT_COURSE_LEVELS,
      types: DEFAULT_INSTITUTE_TYPES,
      affiliations: DEFAULT_AFFILIATION_OPTIONS,
      locations: DEFAULT_PLATFORM_LOCATIONS,
      courseCategoriesFor: (type) => Object.keys(DEFAULT_COURSE_CATEGORIES_BY_TYPE[type] || {}),
      courseSubcategoriesFor: (type, cat) => DEFAULT_COURSE_CATEGORIES_BY_TYPE[type]?.[cat] || [],
      addCategory: async () => { },
      addSubcategory: async () => { },
      deleteCategory: async () => { },
      deleteSubcategory: async () => { },
      addLevel: async () => { },
      deleteLevel: async () => { },
      refreshTaxonomy: async () => { },
    };
  }
  return ctx;
}
