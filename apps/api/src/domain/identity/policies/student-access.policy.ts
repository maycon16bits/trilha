import { User } from "../entities/user.entity";
import { Student } from "../entities/student.entity";
import { ApprovalStatus, UserRole, UserStatus } from "../enums";

// RN-01: o aluno só acessa a área de aluno com conta ACTIVE e aprovação
// APPROVED. Fica numa política (e não no Student) para o Student não precisar
// conhecer o User.
export function canAccessStudentArea(user: User, student: Student): boolean {
  return (
    user.role === UserRole.STUDENT &&
    user.id.equals(student.id) &&
    user.status === UserStatus.ACTIVE &&
    student.approvalStatus === ApprovalStatus.APPROVED
  );
}
