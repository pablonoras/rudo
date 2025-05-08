import { format, parseISO } from 'date-fns';
import {
    Archive,
    Calendar,
    CheckCircle,
    Edit2,
    Eye,
    MoreVertical,
    RefreshCw,
    Trash2,
    UserMinus,
    Users
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Program, ProgramStatus } from '../../lib/workout';

interface ProgramCardProps {
  program: Program;
  onStatusChange: (status: ProgramStatus) => void;
  onDelete: () => void;
  onEdit?: () => void;
  onManageAssignments?: () => void;
}

export function ProgramCard({ program, onStatusChange, onDelete, onEdit, onManageAssignments }: ProgramCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const getStatusColor = (status: ProgramStatus) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[status];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {program.name}
              </h3>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusColor(
                  program.status
                )}`}
              >
                {program.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {format(parseISO(program.startDate), 'MMM d')} -{' '}
              {format(parseISO(program.endDate), 'MMM d, yyyy')}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit();
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Program
                    </button>
                  )}
                  {onManageAssignments && (
                    <button
                      onClick={() => {
                        onManageAssignments();
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Manage Assignments
                    </button>
                  )}
                  {program.status === 'draft' && (
                    <button
                      onClick={() => {
                        onStatusChange('published');
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish Program
                    </button>
                  )}
                  {program.status === 'published' && (
                    <button
                      onClick={() => {
                        onStatusChange('archived');
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Program
                    </button>
                  )}
                  {program.status === 'archived' && (
                    <button
                      onClick={() => {
                        onStatusChange('draft');
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Revert to Draft
                    </button>
                  )}
                  <Link
                    to={`/coach/program/${program.id}`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Program
                  </Link>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Program
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{program.weekCount} weeks</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{Object.keys(program.days).length} workouts</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Users className="h-4 w-4 mr-1" />
            <span>
              {program.assignedTo.athletes.length} assigned
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Link
            to={`/coach/program/${program.id}`}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm inline-flex items-center"
          >
            View Details
            <Calendar className="h-4 w-4 ml-1" />
          </Link>
          <Link
            to={`/coach/program/${program.id}/assign`}
            className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 inline-flex items-center"
          >
            <Users className="h-4 w-4 mr-1" />
            Assign
          </Link>
        </div>
      </div>
    </div>
  );
}