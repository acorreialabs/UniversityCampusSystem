import { z } from 'zod';
import {
  isValidMozambiquePlate,
  MOZAMBIQUE_PLATE_MESSAGE,
  normalizeMozambiquePlate,
} from './mozambiquePlate.js';

export * from './mozambiquePlate.js';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password deve ter pelo menos 8 caracteres'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, 'Refresh token inválido'),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
  role: z.enum(['STUDENT', 'TEACHER', 'TECHNICIAN', 'COORDINATOR', 'ADMIN']),
});

export const createRoomSchema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(2).max(120),
  capacity: z.number().int().positive().max(1000),
  floor: z.number().int().min(-5).max(100).default(0),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED']).optional(),
  buildingId: z.string().min(1),
});

export const createIncidentSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(5).max(2000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  roomId: z.string().optional().nullable(),
  equipmentId: z.string().optional().nullable(),
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  notes: z.string().max(1000).optional(),
  assigneeId: z.string().optional().nullable(),
});

const mozambiquePlateSchema = z
  .string()
  .min(8)
  .max(14)
  .transform(normalizeMozambiquePlate)
  .refine(isValidMozambiquePlate, { message: MOZAMBIQUE_PLATE_MESSAGE });

export const createPlateReadingSchema = z.object({
  lotId: z.string().min(1),
  plate: mozambiquePlateSchema,
  direction: z.enum(['IN', 'OUT']),
  sensorCode: z.string().min(2).max(64).default('CAM-LPR-SIM'),
  confidence: z.number().min(0).max(1).default(0.9),
  photoUrl: z.string().url().optional().nullable(),
  spotCode: z.string().min(2).max(16).optional().nullable(),
});

export const updateParkingSpotSchema = z.object({
  status: z.enum(['FREE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE']),
  plate: mozambiquePlateSchema.optional().nullable(),
});

const assessmentTypeSchema = z.enum(['TEST','EXAM','ASSIGNMENT','PRACTICAL','ORAL','OTHER','RECURRENCE']);
const gradingModeSchema = z.enum(['PERCENTAGE','POINTS','SCALE']);
export const createAssessmentSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional().or(z.null()),
  subjectId: z.string().min(1),
  type: assessmentTypeSchema.optional().default('TEST'),
  gradingMode: gradingModeSchema.optional().default('PERCENTAGE'),
  maxScore: z.number().positive().max(1000).optional(),
  weight: z.number().positive().max(100).optional().or(z.literal(100)),
  date: z.coerce.date().optional().or(z.null()),
});

export const updateAssessmentSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(500).optional().or(z.null()),
  type: assessmentTypeSchema.optional(),
  gradingMode: gradingModeSchema.optional(),
  maxScore: z.number().positive().max(1000).optional(),
  weight: z.number().positive().max(100).optional().or(z.literal(100)),
  date: z.coerce.date().optional().or(z.null()),
});

export const setRequiredTestCountSchema = z.object({
  requiredTestCount: z.number().int().min(1).max(20).nullable(),
});

export const setSubjectRulesSchema = z
  .object({
    requiredTestCount: z.number().int().min(1).max(20).nullable().optional(),
    recurrenceMinAdmission: z.number().min(0).max(20).nullable().optional(),
  })
  .refine((v) => v.requiredTestCount !== undefined || v.recurrenceMinAdmission !== undefined, {
    message: 'Indique requiredTestCount e/ou recurrenceMinAdmission',
  });

export const publishResultsSchema = z.object({
  published: z.boolean(),
});

export const upsertGradesSchema = z.object({
  grades: z
    .array(
      z.object({
        studentId: z.string().min(1),
        value: z.number(),
        comment: z.string().max(500).optional().nullable(),
      }),
    )
    .min(1)
    .max(200),
});

export const createResultSchema = z.object({
  assessmentId: z.string().min(1),
  studentId: z.string().min(1),
  value: z.number(),
  comment: z.string().max(500).optional().nullable(),
});

const scheduleBase = {
  title: z.string().min(3).max(160),
  subjectId: z.string().min(1),
  courseId: z.string().min(1),
  teacherId: z.string().min(1).optional().nullable(),
  roomId: z.string().min(1).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
};

export const createScheduleSchema = z
  .object(scheduleBase)
  .refine((s) => s.endsAt.getTime() > s.startsAt.getTime(), {
    message: 'endsAt deve ser posterior a startsAt',
    path: ['endsAt'],
  });

export const updateScheduleSchema = z
  .object({
    title: scheduleBase.title.optional(),
    subjectId: scheduleBase.subjectId.optional(),
    courseId: scheduleBase.courseId.optional(),
    teacherId: scheduleBase.teacherId,
    roomId: scheduleBase.roomId,
    startsAt: scheduleBase.startsAt.optional(),
    endsAt: scheduleBase.endsAt.optional(),
  })
  .refine(
    (s) => {
      if (s.startsAt && s.endsAt) return s.endsAt.getTime() > s.startsAt.getTime();
      return true;
    },
    { message: 'endsAt deve ser posterior a startsAt', path: ['endsAt'] },
  );

export const attendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED']);

export const markAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: attendanceStatusSchema,
        note: z.string().max(500).optional().nullable(),
      }),
    )
    .min(1)
    .max(300),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
export type CreatePlateReadingInput = z.infer<typeof createPlateReadingSchema>;
export type UpdateParkingSpotInput = z.infer<typeof updateParkingSpotSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
export type SetRequiredTestCountInput = z.infer<typeof setRequiredTestCountSchema>;
export type SetSubjectRulesInput = z.infer<typeof setSubjectRulesSchema>;
export type PublishResultsInput = z.infer<typeof publishResultsSchema>;
export type UpsertGradesInput = z.infer<typeof upsertGradesSchema>;
export type CreateResultInput = z.infer<typeof createResultSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

// Schemas do módulo academic (preservado do upstream — grupo académico)
export const createDepartmentSchema = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(3).max(120),
  description: z.string().max(500).optional(),
});

export const createCourseSchema = z.object({
  code: z.string().trim().min(2).max(10),
  name: z.string().trim().min(3).max(120),
  description: z.string().max(500).optional(),
  departmentId: z.string().min(1, 'Departamento obrigatório'),
});

export const createSubjectSchema = z.object({
  code: z.string().trim().min(2).max(10),
  name: z.string().trim().min(3).max(120),
  credits: z.number().int().positive(),
  courseId: z.string().min(1, 'Curso obrigatório'),
});

export const batchCreateCourseWithSubjectsSchema = z.object({
  course: createCourseSchema,
  subjects: z.array(createSubjectSchema.omit({ courseId: true })).min(1),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type BatchCreateCourseWithSubjectsInput = z.infer<typeof batchCreateCourseWithSubjectsSchema>;
