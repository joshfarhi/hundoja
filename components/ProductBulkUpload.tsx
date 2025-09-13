'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import {
  Upload,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface UploadResult {
  success: boolean;
  product: any;
  error?: string;
}

interface ProductBulkUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function ProductBulkUpload({ onSuccess, onCancel, className }: ProductBulkUploadProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,description,sku,price,stock_quantity,category_name,sizes,colors,is_featured,is_active,image1,image2,image3
"Premium Hoodie","Comfortable oversized hoodie","HOODIE-001",89.99,25,"Hoodies","S,M,L,XL,XXL","Black,Charcoal,Stone",true,true,"https://example.com/hoodie1.jpg","https://example.com/hoodie2.jpg"
"Urban Pants","Stylish cargo pants","PANTS-001",129.99,15,"Pants","28,30,32,34,36","Black,Olive,Navy",true,true,"https://example.com/pants1.jpg"
"Cotton Tee","Classic t-shirt","TEE-001",45.99,50,"T-Shirts","S,M,L,XL","Black,White,Gray",false,true,"https://example.com/tee1.jpg","https://example.com/tee2.jpg","https://example.com/tee3.jpg"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-upload-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }

    setSelectedFile(file);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        showToast('CSV file must have at least a header row and one data row', 'error');
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const requiredHeaders = ['name', 'sku', 'price', 'category_name'];

      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        showToast(`Missing required columns: ${missingHeaders.join(', ')}`, 'error');
        return;
      }

      const products = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        const product: any = {};

        headers.forEach((header, i) => {
          let value = values[i]?.replace(/"/g, '').trim() || '';

          // Type conversion
          if (header === 'price' || header === 'stock_quantity') {
            product[header] = value ? parseFloat(value) : (header === 'stock_quantity' ? 10 : 0);
          } else if (header === 'is_featured' || header === 'is_active') {
            product[header] = value.toLowerCase() === 'true';
          } else if (header === 'sizes' || header === 'colors') {
            product[header] = value ? value.split(',').map(v => v.trim()).filter(v => v) : [];
          } else if (header.startsWith('image')) {
            if (!product.images) product.images = [];
            if (value) product.images.push(value);
          } else {
            product[header] = value;
          }
        });

        // Find category ID
        const category = categories.find(c =>
          c.name.toLowerCase() === product.category_name?.toLowerCase()
        );
        product.category_id = category?.id || '';
        product.rowNumber = index + 2; // +2 because of 0-indexing and header row

        return product;
      });

      setParsedData(products);
      setUploadResults([]);
    };
    reader.readAsText(file);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const uploadProducts = async () => {
    if (parsedData.length === 0) {
      showToast('No products to upload', 'error');
      return;
    }

    setUploading(true);
    const results: UploadResult[] = [];

    for (const product of parsedData) {
      try {
        // Validate required fields
        if (!product.name || !product.sku || !product.price || !product.category_id) {
          results.push({
            success: false,
            product,
            error: 'Missing required fields'
          });
          continue;
        }

        // Prepare product data for API
        const productData = {
          name: product.name,
          description: product.description || '',
          sku: product.sku,
          price: product.price,
          stock_quantity: product.stock_quantity || 10,
          category_id: product.category_id,
          images: product.images || [],
          is_active: product.is_active !== false,
          is_featured: product.is_featured || false,
          sizes: product.sizes || [],
          colors: product.colors || []
        };

        const response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        if (response.ok) {
          const result = await response.json();
          results.push({
            success: true,
            product: result
          });
        } else {
          const errorData = await response.json();
          results.push({
            success: false,
            product,
            error: errorData.error || 'Failed to create product'
          });
        }
      } catch (error) {
        results.push({
          success: false,
          product,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setUploadResults(results);
    setUploading(false);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      showToast(`Successfully uploaded ${successCount} products!`, 'success');
    }
    if (failCount > 0) {
      showToast(`Failed to upload ${failCount} products. Check the results below.`, 'error');
    }

    if (successCount > 0) {
      onSuccess?.();
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setParsedData([]);
    setUploadResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const successCount = uploadResults.filter(r => r.success).length;
  const errorCount = uploadResults.filter(r => !r.success).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-neutral-900 rounded-xl p-6 max-w-4xl mx-auto', className)}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Upload size={24} />
          Bulk Product Upload
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Template Download */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">CSV Template</h3>
            <p className="text-neutral-300 text-sm">
              Download the template to see the required format and sample data.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Download size={16} />
            Download Template
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Select CSV File
        </label>
        <div className="border-2 border-dashed border-neutral-600 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!selectedFile ? (
            <div>
              <FileText size={48} className="mx-auto text-neutral-500 mb-4" />
              <p className="text-neutral-400 mb-4">
                Click to select a CSV file or drag and drop
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
              >
                Choose File
              </button>
            </div>
          ) : (
            <div>
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-white font-semibold mb-2">{selectedFile.name}</p>
              <p className="text-neutral-400 text-sm mb-4">
                {(selectedFile.size / 1024).toFixed(1)} KB • {parsedData.length} products found
              </p>
              <button
                onClick={resetUpload}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
              >
                Choose Different File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {parsedData.length > 0 && uploadResults.length === 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Preview ({parsedData.length} products)</h3>
          <div className="bg-neutral-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-neutral-300">#</th>
                    <th className="px-4 py-3 text-left text-neutral-300">Name</th>
                    <th className="px-4 py-3 text-left text-neutral-300">SKU</th>
                    <th className="px-4 py-3 text-left text-neutral-300">Price</th>
                    <th className="px-4 py-3 text-left text-neutral-300">Category</th>
                    <th className="px-4 py-3 text-left text-neutral-300">Stock</th>
                    <th className="px-4 py-3 text-left text-neutral-300">Images</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((product, index) => (
                    <tr key={index} className="border-t border-neutral-700">
                      <td className="px-4 py-3 text-neutral-300">{product.rowNumber}</td>
                      <td className="px-4 py-3 text-white">{product.name}</td>
                      <td className="px-4 py-3 text-neutral-300 font-mono">{product.sku}</td>
                      <td className="px-4 py-3 text-white">${product.price}</td>
                      <td className="px-4 py-3 text-neutral-300">{product.category_name}</td>
                      <td className="px-4 py-3 text-neutral-300">{product.stock_quantity}</td>
                      <td className="px-4 py-3 text-neutral-300">{product.images?.length || 0}</td>
                    </tr>
                  ))}
                  {parsedData.length > 5 && (
                    <tr className="border-t border-neutral-700">
                      <td colSpan={7} className="px-4 py-3 text-center text-neutral-500">
                        ... and {parsedData.length - 5} more products
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upload Results</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" />
                <span className="text-green-400 font-semibold">{successCount} Success</span>
              </div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <XCircle size={20} className="text-red-500" />
                <span className="text-red-400 font-semibold">{errorCount} Failed</span>
              </div>
            </div>
            <div className="bg-neutral-700 rounded-lg p-4">
              <div className="text-neutral-300 text-sm">Total Processed</div>
              <div className="text-white font-semibold">{uploadResults.length}</div>
            </div>
          </div>

          {errorCount > 0 && (
            <div className="bg-neutral-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-neutral-700">
                <h4 className="text-red-400 font-semibold flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Errors
                </h4>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {uploadResults
                  .filter(r => !r.success)
                  .map((result, index) => (
                    <div key={index} className="p-4 border-b border-neutral-700 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-semibold">{result.product.name}</p>
                          <p className="text-neutral-400 text-sm">Row {result.product.rowNumber}</p>
                        </div>
                        <XCircle size={16} className="text-red-500 flex-shrink-0" />
                      </div>
                      <p className="text-red-400 text-sm mt-2">{result.error}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-neutral-700">
        <div className="text-sm text-neutral-400">
          {parsedData.length > 0 && (
            <span>Ready to upload {parsedData.length} products</span>
          )}
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}

          {parsedData.length > 0 && uploadResults.length === 0 && (
            <button
              onClick={uploadProducts}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {uploading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Products
                </>
              )}
            </button>
          )}

          {uploadResults.length > 0 && (
            <button
              onClick={resetUpload}
              className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              Upload Another File
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
