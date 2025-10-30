import React from 'react';
import ReadOnlyProcessField from './ReadOnlyProcessField';

interface ProcessField {
  field_id: string;
  field_name: string;
  data_type: string;
  is_required: boolean;
  units: string[];
}

interface Process {
  process_id: string;
  name: string;
  fields?: ProcessField[];
}

interface ReadOnlyProcessProps {
  process: Process;
}

export const ReadOnlyProcess: React.FC<ReadOnlyProcessProps> = ({ process }) => {
  return (
    <div key={process.process_id} className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 mb-3">
          {process.name}
        </h3>
        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Read Only</span>
      </div>
      {process.fields && process.fields.map((field) => (
        <ReadOnlyProcessField key={field.field_id} field={field} />
      ))}
    </div>
  );
};

export default ReadOnlyProcess;
