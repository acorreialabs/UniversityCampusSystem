import type {
  ApiError,
  ApiSuccess,
  AssessmentDto,
  AssessmentOptions,
  AssessmentRoster,
  AttendanceDto,
  AttendanceRoster,
  AttendanceSummaryDto,
  AuthUser,
  CourseDto,
  DashboardSummary,
  DepartmentDto,
  FinalGradeDto,
  GradeDto,
  IncidentDto,
  LoginResponse,
  ParkingLotOverview,
  PlateReadingDto,
  ResultDto,
  RoomDto,
  ScheduleDto,
  ScheduleFiltersInput,
  ScheduleOptions,
  SubjectBoard,
  SubjectDto,
} from '@smart-campus/shared-types';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly correlationId: string,
    public readonly details: unknown[] = [],
    public readonly status = 400,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export type TokenStore = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clear: () => void;
};

function toQuery(params?: Record<string, string | undefined>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function createApiClient(baseUrl: string, tokenStore: TokenStore) {
  async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<ApiSuccess<T>> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    const access = tokenStore.getAccessToken();
    if (access) headers.set('Authorization', `Bearer ${access}`);

    const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
    const body = await res.json().catch(() => ({}));

    if (res.status === 401 && retry && tokenStore.getRefreshToken()) {
      const refreshed = await refresh();
      if (refreshed) return request<T>(path, init, false);
    }

    if (!res.ok) {
      const err = body as ApiError;
      throw new ApiClientError(err.code ?? 'UNKNOWN', err.message ?? 'Erro desconhecido', err.correlationId ?? '', err.details ?? [], res.status);
    }

    return body as ApiSuccess<T>;
  }

  async function refresh(): Promise<boolean> {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) return false;
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      tokenStore.clear();
      return false;
    }
    const json = (await res.json()) as ApiSuccess<{ accessToken: string; refreshToken: string }>;
    tokenStore.setTokens(json.data.accessToken, json.data.refreshToken);
    return true;
  }

  return {
    login: (email: string, password: string) =>
      request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false),
    logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: tokenStore.getRefreshToken() }) }),
    me: () => request<AuthUser>('/me'),
    users: () => request<AuthUser[]>('/users'),
    rooms: () => request<RoomDto[]>('/rooms'),
    room: (id: string) => request<RoomDto>(`/rooms/${id}`),
    createRoom: (payload: unknown) => request<RoomDto>('/rooms', { method: 'POST', body: JSON.stringify(payload) }),
    incidents: () => request<IncidentDto[]>('/incidents'),
    createIncident: (payload: unknown) => request<IncidentDto>('/incidents', { method: 'POST', body: JSON.stringify(payload) }),
    updateIncidentStatus: (id: string, payload: unknown) =>
      request<IncidentDto>(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
    devices: () => request<unknown[]>('/devices'),
    alerts: () => request<unknown[]>('/alerts'),
    auditEvents: () => request<unknown[]>('/audit-events'),
    dashboard: () => request<DashboardSummary>('/dashboard'),
    parkingOverview: () => request<ParkingLotOverview[]>('/parking/overview'),
    parkingReadings: () => request<PlateReadingDto[]>('/parking/readings'),
    createPlateReading: (payload: unknown) =>
      request<PlateReadingDto>('/parking/readings', { method: 'POST', body: JSON.stringify(payload) }),
    updateParkingSpot: (id: string, payload: unknown) =>
      request<unknown>(`/parking/spots/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    assessments: () => request<AssessmentDto[]>('/assessments'),
    assessmentOptions: () => request<AssessmentOptions>('/assessments/options'),
    assessmentRoster: (id: string) => request<AssessmentRoster>(`/assessments/${id}/roster`),
    assessmentGrades: (id: string) => request<GradeDto[]>(`/assessments/${id}/grades`),
    upsertGrades: (id: string, payload: unknown) =>
      request<GradeDto[]>(`/assessments/${id}/grades`, { method: 'POST', body: JSON.stringify(payload) }),
    createAssessment: (payload: unknown) =>
      request<AssessmentDto>('/assessments', { method: 'POST', body: JSON.stringify(payload) }),
    updateAssessment: (id: string, payload: unknown) =>
      request<AssessmentDto>(`/assessments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    setRequiredTestCount: (subjectId: string, requiredTestCount: number | null) =>
      request<{ id: string; code: string; name: string; requiredTestCount: number | null }>(
        `/assessments/subject/${subjectId}/required-test-count`,
        { method: 'PATCH', body: JSON.stringify({ requiredTestCount }) },
      ),
    subjectBoard: (subjectId: string) => request<SubjectBoard>(`/assessments/subject/${subjectId}/board`),
    setSubjectRules: (
      subjectId: string,
      payload: { requiredTestCount?: number | null; recurrenceMinAdmission?: number | null },
    ) =>
      request<{ id: string; code: string; name: string; requiredTestCount: number | null; recurrenceMinAdmission: number | null; resultsPublishedAt: string | Date | null }>(
        `/assessments/subject/${subjectId}/rules`,
        { method: 'PATCH', body: JSON.stringify(payload) },
      ),
    publishResults: (subjectId: string, published: boolean) =>
      request<{
        subjectId: string;
        subjectCode: string;
        subjectName: string;
        published: boolean;
        publishedAt: string | null;
      }>(`/assessments/subject/${subjectId}/publish`, { method: 'POST', body: JSON.stringify({ published }) }),
    setSubjectExemption: (
      subjectId: string,
      payload: { studentId: string; exempted: boolean; grade?: number | null; reason?: string | null },
    ) =>
      request<{ subjectId: string; studentId: string; exempted: boolean; grade: number | null }>(
        `/assessments/subject/${subjectId}/exemptions`,
        { method: 'POST', body: JSON.stringify(payload) },
      ),
    myGrades: () => request<GradeDto[]>('/my/grades'),
    myFinalGrades: () => request<FinalGradeDto[]>('/my/final-grades'),
    results: (params?: Record<string, string | undefined>) =>
      request<ResultDto[]>(`/results${toQuery(params)}`),
    createResult: (payload: unknown) =>
      request<ResultDto>('/results', { method: 'POST', body: JSON.stringify(payload) }),
    attendance: (filters: Record<string, string | undefined> = {}) =>
      request<AttendanceDto[]>(`/attendance${toQuery(filters)}`),
    attendanceSummary: (filters: Record<string, string | undefined> = {}) =>
      request<AttendanceSummaryDto[]>(`/attendance/summary${toQuery(filters)}`),
    attendanceSessions: () => request<ScheduleDto[]>('/attendance/sessions'),
    attendanceRoster: (scheduleId: string) =>
      request<AttendanceRoster>(`/attendance/sessions/${scheduleId}`),
    markAttendance: (scheduleId: string, payload: unknown) =>
      request<AttendanceRoster>(`/attendance/sessions/${scheduleId}`, { method: 'POST', body: JSON.stringify(payload) }),
    schedules: (filters: ScheduleFiltersInput = {}) =>
      request<ScheduleDto[]>(`/schedules${toQuery(filters as Record<string, string | undefined>)}`),
    scheduleOptions: () => request<ScheduleOptions>('/schedules/options'),
    createSchedule: (payload: unknown) =>
      request<ScheduleDto>('/schedules', { method: 'POST', body: JSON.stringify(payload) }),
    updateSchedule: (id: string, payload: unknown) =>
      request<ScheduleDto>(`/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    deleteSchedule: (id: string) => request<{ id: string }>(`/schedules/${id}`, { method: 'DELETE' }),
    departments: () => request<DepartmentDto[]>('/departments'),
    createDepartment: (payload: unknown) =>
      request<DepartmentDto>('/departments', { method: 'POST', body: JSON.stringify(payload) }),
    deleteDepartment: (id: string) => request<{ ok: true }>(`/departments/${id}`, { method: 'DELETE' }),
    courses: (departmentId?: string) =>
      request<CourseDto[]>(`/courses${departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : ''}`),
    createCourse: (payload: unknown) =>
      request<CourseDto>('/courses', { method: 'POST', body: JSON.stringify(payload) }),
    createCourseWithSubjects: (payload: unknown) =>
      request<{ course: CourseDto; subjects: SubjectDto[] }>('/courses/batch-with-subjects', { method: 'POST', body: JSON.stringify(payload) }),
    subjects: (courseId?: string) =>
      request<SubjectDto[]>(`/subjects${courseId ? `?courseId=${encodeURIComponent(courseId)}` : ''}`),
    createSubject: (payload: unknown) =>
      request<SubjectDto>('/subjects', { method: 'POST', body: JSON.stringify(payload) }),
    health: async () => {
      const res = await fetch(`${baseUrl.replace(/\/api\/v1$/, '')}/health`);
      return res.json();
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
