import React from 'react';

interface ProcessField {
  field_id: string;
  field_name: string;
  data_type: string;
  is_required: boolean;
  units: string[];
}

interface ReadOnlyProcessFieldProps {
  field: ProcessField;
}

export const ReadOnlyProcessField: React.FC<ReadOnlyProcessFieldProps> = ({ field }) => {
  return (
    <div key={field.field_id} className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.field_name}
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.data_type.toLowerCase() === 'date' ? (
        <input
          type="date"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
          required={field.is_required}
          disabled
          readOnly
        />
      ) : field.data_type.toLowerCase() === 'time' ? (
        <input
          type="time"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
          required={field.is_required}
          disabled
          readOnly
        />
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
            required={field.is_required}
            placeholder={`Enter ${field.field_name.toLowerCase()}`}
            disabled
            readOnly
          />
          {field.units && field.units.length > 0 && (
            <select 
              className="border border-gray-300 rounded px-2 py-2 text-sm bg-gray-100 cursor-not-allowed"
              defaultValue={field.units[0]}
              disabled
            >
              {field.units.map((unit, unitIndex) => (
                <option key={unitIndex} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
};

export default ReadOnlyProcessField;
