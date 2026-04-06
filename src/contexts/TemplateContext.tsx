import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface TemplateContextType {
  templates: any[];
  addTemplate: (data: { name: string; category: string; description: string; fileUrl?: string; fileName?: string }) => Promise<void>;
  updateTemplate: (id: string, updates: { name: string; category: string; description: string; fileUrl?: string; fileName?: string | null }) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType>({} as TemplateContextType);

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("/templates");
        setTemplates(res.data.data || []);
      } catch (err) {
        console.error("Failed to load templates:", err);
      }
    };
    fetchTemplates();
  }, []);

  const addTemplate: TemplateContextType["addTemplate"] = async (data) => {
    try {
      const res = await api.post("/templates", data);
      setTemplates((prev) => [res.data.data, ...prev]);
    } catch (err) {
      console.error("Failed to add template:", err);
    }
  };

  const updateTemplate: TemplateContextType["updateTemplate"] = async (id, updates) => {
    try {
      const res = await api.put(`/templates/${id}`, updates);
      setTemplates((prev) => prev.map((t) => (t._id === id || t.id === id ? res.data.data : t)));
    } catch (err) {
      console.error("Failed to update template:", err);
    }
  };

  const deleteTemplate: TemplateContextType["deleteTemplate"] = async (id) => {
    try {
      await api.delete(`/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== id && t.id !== id));
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  return (
    <TemplateContext.Provider value={{ templates, addTemplate, updateTemplate, deleteTemplate }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplates = () => useContext(TemplateContext);


