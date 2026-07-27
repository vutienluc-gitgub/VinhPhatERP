import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Icon, Button } from '@/shared/components';
import {
  PUBLIC_PAGE_LABELS as LABELS,
  STRETCH_TYPE_MAP,
  THICKNESS_MAP,
} from '@/features/fabric-catalog/fabric-catalog.constants';

export type CompareItem = {
  id: string;
  code: string;
  name: string;
  slug: string;
  composition: string | null;
  target_width_cm: number | null;
  target_gsm: number | null;
  stretch_type: string | null;
  thickness: string | null;
  moq: string;
  lead_time: string;
};

interface PublicCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  compareList: CompareItem[];
  setCompareList: (list: CompareItem[]) => void;
}

export function PublicCompareModal({
  isOpen,
  onClose,
  compareList,
  setCompareList,
}: PublicCompareModalProps) {
  if (!isOpen) return null;

  const clearCompare = () => {
    setCompareList([]);
    localStorage.removeItem('vp_fabric_compare');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-default flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Icon name="Scale" className="w-5 h-5 text-primary" />
            {LABELS.compareTitle} ({compareList.length}/3)
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-surface-secondary text-muted"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-x-auto p-4">
          {compareList.length < 2 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {LABELS.compareEmpty}
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs text-secondary min-w-[500px]">
              <thead>
                <tr className="border-b border-default bg-slate-50">
                  <th className="p-3 font-semibold text-foreground w-1/4">
                    Thông số
                  </th>
                  {compareList.map((item) => (
                    <th
                      key={item.id}
                      className="p-3 font-bold text-primary w-1/4"
                    >
                      <Link
                        to={`/p/fabric/${item.slug}`}
                        onClick={onClose}
                        className="hover:underline"
                      >
                        {item.code}
                      </Link>
                      <span className="block text-[10px] text-muted font-normal mt-0.5 truncate">
                        {item.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-medium text-primary">
                    {LABELS.composition}
                  </td>
                  {compareList.map((item) => (
                    <td key={item.id} className="p-3">
                      {item.composition || LABELS.na}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-primary">
                    {LABELS.width}
                  </td>
                  {compareList.map((item) => (
                    <td key={item.id} className="p-3">
                      {item.target_width_cm
                        ? `${item.target_width_cm} cm`
                        : LABELS.na}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-primary">{LABELS.gsm}</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="p-3">
                      {item.target_gsm ? `${item.target_gsm} gsm` : LABELS.na}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-primary">
                    {LABELS.stretch}
                  </td>
                  {compareList.map((item) => (
                    <td key={item.id} className="p-3">
                      {item.stretch_type
                        ? STRETCH_TYPE_MAP[item.stretch_type] ||
                          item.stretch_type
                        : LABELS.na}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-primary">
                    {LABELS.thickness}
                  </td>
                  {compareList.map((item) => (
                    <td key={item.id} className="p-3">
                      {item.thickness
                        ? THICKNESS_MAP[item.thickness] || item.thickness
                        : LABELS.na}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-primary">MOQ</td>
                  {compareList.map((item) => (
                    <td
                      key={item.id}
                      className="p-3 font-semibold text-primary"
                    >
                      {item.moq}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-primary">
                    Thời gian giao
                  </td>
                  {compareList.map((item) => (
                    <td
                      key={item.id}
                      className="p-3 font-semibold text-primary"
                    >
                      {item.lead_time}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-default">
                  <td className="p-3"></td>
                  {compareList.map((item) => (
                    <td key={item.id} className="p-3">
                      <button
                        onClick={() => {
                          const updated = compareList.filter(
                            (x) => x.id !== item.id,
                          );
                          setCompareList(updated);
                          localStorage.setItem(
                            'vp_fabric_compare',
                            JSON.stringify(updated),
                          );
                          toast.success(LABELS.removeCompareSuccess);
                        }}
                        className="text-danger hover:text-danger font-semibold"
                      >
                        Xóa
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {compareList.length > 0 && (
          <div className="p-4 border-t border-default flex justify-end gap-2 bg-slate-50">
            <Button variant="outline" onClick={clearCompare}>
              {LABELS.clearAll}
            </Button>
            <Button variant="primary" onClick={onClose}>
              {LABELS.close}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
