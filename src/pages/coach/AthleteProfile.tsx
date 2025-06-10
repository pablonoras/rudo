import { format, parseISO } from 'date-fns';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Award,
  Calendar,
  ChevronRight,
  Clock,
  Edit2,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EditProfileModal } from '../../components/athlete/EditProfileModal';
import { useAthleteStore } from '../../lib/athlete';
import { useWorkoutStore } from '../../lib/workout';

export function AthleteProfile() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const athletes = useAthleteStore((state) => state.athletes);
  const programs = useWorkoutStore((state) => state.programs);
  const [isEditing, setIsEditing] = useState(false);

  const athlete = athleteId ? athletes[athleteId] : null;

  // Get assigned programs for this athlete
  const assignedPrograms = Object.values(programs).filter(program => 
    program.assignedTo.athletes.includes(athleteId || '') ||
    (athlete?.team && program.assignedTo.teams.includes(athlete.team))
  );

  if (!athlete) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Athlete Not Found
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The athlete you're looking for doesn't exist or you don't have permission to view their profile.
        </p>
        <button
          onClick={() => navigate('/coach/athletes')}
          className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Athletes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/coach/athletes')}
          className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Athletes
        </button>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(`/coach/athlete/${athleteId}/calendar`)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Overview */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center">
            <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <User className="h-12 w-12 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {athlete.firstName} {athlete.lastName}
              </h1>
              <div className="mt-2 flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  athlete.level === 'beginner' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                    : athlete.level === 'intermediate'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
                }`}>
                  {athlete.level}
                </span>
                {athlete.team && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    • {athlete.team}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {athlete.email}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Phone
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {athlete.phone || 'Not provided'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Date of Birth
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {athlete.dateOfBirth 
                  ? format(new Date(athlete.dateOfBirth), 'MMMM d, yyyy')
                  : 'Not provided'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Assigned Programs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Assigned Programs
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {assignedPrograms.length > 0 ? (
            assignedPrograms.map((program) => (
              <Link
                key={program.id}
                to={`/coach/program/${program.id}`}
                className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {program.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {format(parseISO(program.startDate), 'MMM d')} -{' '}
                      {format(parseISO(program.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {program.weekCount} weeks
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    program.status === 'published'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                      : program.status === 'draft'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                  }`}>
                    {program.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No programs assigned yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-gray-100">
              Activity
            </h3>
          </div>
          <dl className="mt-4">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Last Active
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Today
              </dd>
            </div>
            <div className="flex justify-between mt-2">
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Workouts Completed
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                24
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-gray-100">
              Attendance
            </h3>
          </div>
          <dl className="mt-4">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                This Month
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                85%
              </dd>
            </div>
            <div className="flex justify-between mt-2">
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Last Month
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                92%
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-gray-100">
              Achievements
            </h3>
          </div>
          <dl className="mt-4">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Personal Records
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                12
              </dd>
            </div>
            <div className="flex justify-between mt-2">
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Badges Earned
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                8
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Emergency Contact
        </h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Contact Name
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {athlete.emergencyContact || 'Not provided'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Contact Phone
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {athlete.emergencyPhone || 'Not provided'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && athleteId && (
        <EditProfileModal
          athleteId={athleteId}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}