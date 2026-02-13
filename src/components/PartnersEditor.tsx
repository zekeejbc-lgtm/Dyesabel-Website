import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Upload, Users, Building2, Globe2, Flag, FolderPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Partner {
  id: string;
  name: string;
  logo: string;
}

interface PartnerCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  partners: Partner[];
}

interface PartnersEditorProps {
  categories: PartnerCategory[];
  onSave: (categories: PartnerCategory[]) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  coalitions: <Users className="w-6 h-6" />,
  gov: <Building2 className="w-6 h-6" />,
  'ngo-nat': <Flag className="w-6 h-6" />,
  'ngo-int': <Globe2 className="w-6 h-6" />
};

export const PartnersEditor: React.FC<PartnersEditorProps> = ({ categories, onSave, onClose }) => {
  const { user } = useAuth();
  // ✅ FIX: Ensure we default to an empty array if undefined passed
  const [editedCategories, setEditedCategories] = useState<PartnerCategory[]>(categories || []);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Check permission
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return null;
  }

  // ✅ NEW: Ability to add a new category if list is empty
  const addCategory = () => {
    const newCategory: PartnerCategory = {
      id: `cat_${Date.now()}`,
      title: 'New Category',
      icon: <Users className="w-6 h-6" />,
      partners: []
    };
    const updated = [...editedCategories, newCategory];
    setEditedCategories(updated);
    setSelectedCategoryIndex(updated.length - 1); // Switch to new category
  };

  const removeCategory = (index: number) => {
    if (!confirm('Delete this entire category and all its partners?')) return;
    const updated = editedCategories.filter((_, i) => i !== index);
    setEditedCategories(updated);
    // Adjust selection if we deleted the current or last item
    if (selectedCategoryIndex >= updated.length) {
      setSelectedCategoryIndex(Math.max(0, updated.length - 1));
    }
  };

  const updateCategory = (index: number, field: keyof PartnerCategory, value: any) => {
    const updated = [...editedCategories];
    updated[index] = { ...updated[index], [field]: value };
    setEditedCategories(updated);
  };

  const updatePartner = (categoryIndex: number, partnerIndex: number, field: keyof Partner, value: string) => {
    const updated = [...editedCategories];
    const partners = [...updated[categoryIndex].partners];
    partners[partnerIndex] = { ...partners[partnerIndex], [field]: value };
    updated[categoryIndex] = { ...updated[categoryIndex], partners };
    setEditedCategories(updated);
  };

  const addPartner = (categoryIndex: number) => {
    const updated = [...editedCategories];
    const newPartner: Partner = {
      id: `p${Date.now()}`,
      name: 'New Partner',
      logo: 'https://ui-avatars.com/api/?name=New+Partner&background=2563eb&color=fff'
    };
    updated[categoryIndex].partners = [...updated[categoryIndex].partners, newPartner];
    setEditedCategories(updated);
  };

  const removePartner = (categoryIndex: number, partnerIndex: number) => {
    if (!confirm('Are you sure you want to remove this partner?')) return;
    const updated = [...editedCategories];
    updated[categoryIndex].partners = updated[categoryIndex].partners.filter((_, i) => i !== partnerIndex);
    setEditedCategories(updated);
  };

  const handleImageUpload = (categoryIndex: number, partnerIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const logo = reader.result as string;
      updatePartner(categoryIndex, partnerIndex, 'logo', logo);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedCategories);
      alert('Partners saved successfully!');
      onClose();
    } catch (error) {
      alert('Error saving partners. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ✅ SAFE ACCESS: Check if category exists
  const currentCategory = editedCategories[selectedCategoryIndex];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Partners</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your partner organizations by category
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Sidebar - Category Selection */}
            <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3 px-2">
                  Categories
                </h3>
                <div className="space-y-2">
                  {editedCategories.map((category, index) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategoryIndex(index)}
                      className={`w-full text-left p-3 rounded-lg transition-all relative group ${
                        selectedCategoryIndex === index
                          ? 'bg-primary-blue text-white shadow-md'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={selectedCategoryIndex === index ? 'text-white' : 'text-primary-blue'}>
                          {CATEGORY_ICONS[category.id] || <Users className="w-5 h-5" />}
                        </div>
                        <span className="text-sm font-medium truncate w-32">{category.title}</span>
                      </div>
                      
                      {/* Delete Category Button (Hover only) */}
                      <div 
                        onClick={(e) => { e.stopPropagation(); removeCategory(index); }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-red-500 hover:text-white transition-colors cursor-pointer ${
                          selectedCategoryIndex === index ? 'text-white/70 hover:text-white' : 'text-gray-400 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Trash2 size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={addCategory}
                className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-primary-blue hover:text-primary-blue transition-colors font-bold text-sm"
              >
                <FolderPlus size={18} />
                New Category
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              {/* ✅ SAFETY CHECK: If no categories exist */}
              {!currentCategory ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50">
                  <FolderPlus className="w-16 h-16 mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-700 dark:text-white">No Categories Selected</h3>
                  <p className="text-sm text-gray-500">Create a new category from the sidebar to get started.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Category Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={currentCategory.title}
                      onChange={(e) => updateCategory(selectedCategoryIndex, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    />
                  </div>

                  {/* Partners */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Partners in this Category
                      </label>
                      <button
                        onClick={() => addPartner(selectedCategoryIndex)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Partner
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentCategory.partners.map((partner, partnerIndex) => (
                        <div
                          key={partner.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              Partner {partnerIndex + 1}
                            </h4>
                            <button
                              onClick={() => removePartner(selectedCategoryIndex, partnerIndex)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Partner Logo */}
                          <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <img
                              src={partner.logo}
                              alt={partner.name}
                              className="w-full h-full object-cover"
                            />
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleImageUpload(selectedCategoryIndex, partnerIndex, e.target.files[0])}
                                className="hidden"
                              />
                              <div className="text-white text-center">
                                <Upload className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-xs font-medium">Change</span>
                              </div>
                            </label>
                          </div>

                          {/* Partner Name */}
                          <input
                            type="text"
                            value={partner.name}
                            onChange={(e) => updatePartner(selectedCategoryIndex, partnerIndex, 'name', e.target.value)}
                            placeholder="Partner name"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center font-medium"
                          />
                        </div>
                      ))}
                    </div>

                    {currentCategory.partners.length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No partners in this category yet</p>
                        <p className="text-sm mt-1">Click "Add Partner" to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};