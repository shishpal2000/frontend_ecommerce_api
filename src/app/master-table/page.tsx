"use client";
import React, { useState } from "react";
import LayoutComponents from "../layoutComponents";

function Page() {
  const [tableData, setTableData] = useState([
    {
      id: "",
      fabric: "",
      name: "",
      width: "",
      averageValue: "",
      averageUnit: "",
      gsm: "",
      efficiency: "",
      needleType: "",
    },
  ]);

  // Available dropdown options
  const needleTypes = ["Round", "Flat", "Twin", "Ballpoint", "Other"];
  const averageUnits = ["meter", "kg"];

  // handle input change
  const handleInputChange = (index: number, field: string, value: string) => {
    const updated: any = [...tableData];
    updated[index][field] = value;
    setTableData(updated);
  };

  // add new row
  const handleAddRow = () => {
    setTableData([
      ...tableData,
      {
        id: "",
        fabric: "",
        name: "",
        width: "",
        averageValue: "",
        averageUnit: "",
        gsm: "",
        efficiency: "",
        needleType: "",
      },
    ]);
  };

  // show all rows data (for demo)
  const handleSubmit = () => {
    console.log("Table Data Array:", tableData);
    alert("Data saved! Check console for full array.");
  };

  return (
    <div className="max-w-8xl mx-auto  p-4">
      <div className="w-full mt-10">
        <h1 className="text-2xl font-semibold p-4 text-center">
          Master Table Input Page
        </h1>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="min-w-full bg-white border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border-b text-left">ID</th>
              <th className="py-2 px-4 border-b text-left">Fabric</th>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Width</th>
              <th className="py-2 px-4 border-b text-left">Average Value</th>
              <th className="py-2 px-4 border-b text-left">GSM</th>
              <th className="py-2 px-4 border-b text-left">Efficiency</th>
              <th className="py-2 px-4 border-b text-left">Needle Type</th>
            </tr>
          </thead>

          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                {/* ID */}
                <td className="py-2 px-4 border-b">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    value={row.id}
                    onChange={(e) =>
                      handleInputChange(index, "id", e.target.value)
                    }
                  />
                </td>

                {/* Fabric */}
                <td className="py-2 px-4 border-b">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    value={row.fabric}
                    onChange={(e) =>
                      handleInputChange(index, "fabric", e.target.value)
                    }
                  />
                </td>

                {/* Name */}
                <td className="py-2 px-4 border-b">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    value={row.name}
                    onChange={(e) =>
                      handleInputChange(index, "name", e.target.value)
                    }
                  />
                </td>

                {/* Width */}
                <td className="py-2 px-4 border-b">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    value={row.width}
                    onChange={(e) =>
                      handleInputChange(index, "width", e.target.value)
                    }
                  />
                </td>

                {/* Average Value */}
                <td className="py-2 px-4 border-b">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-gray-300 rounded px-2 py-1"
                      value={row.averageValue}
                      onChange={(e) =>
                        handleInputChange(index, "averageValue", e.target.value)
                      }
                    />

                    {row.averageValue ? (
                      <select
                        className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                        value={row.averageUnit}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "averageUnit",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Select Unit</option>
                        {averageUnits.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-400 text-xs italic">
                        Enter value first
                      </span>
                    )}
                  </div>
                </td>

                {/* GSM */}
                <td className="py-2 px-4 border-b">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    value={row.gsm}
                    onChange={(e) =>
                      handleInputChange(index, "gsm", e.target.value)
                    }
                  />
                </td>

                {/* Efficiency */}
                <td className="py-2 px-4 border-b">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    value={row.efficiency}
                    onChange={(e) =>
                      handleInputChange(index, "efficiency", e.target.value)
                    }
                  />
                </td>

                {/* Needle Type Dropdown */}
                <td className="py-2 px-4 border-b">
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                    value={row.needleType}
                    onChange={(e) =>
                      handleInputChange(index, "needleType", e.target.value)
                    }
                  >
                    <option value="">Select Type</option>
                    {needleTypes.map((type) => (
                      <option key={type} value={type} className="w-full">
                        {type}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-4 mt-4">
          <button
            onClick={handleAddRow}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            ➕ Add Row
          </button>

          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            💾 Save Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default LayoutComponents(Page);
