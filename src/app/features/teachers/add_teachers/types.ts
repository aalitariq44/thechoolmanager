export interface TeacherData {
  // Personal Information
  fullName: string
  motherName?: string
  birthDate?: string
  birthPlace?: string
  address?: string
  landmark?: string
  phoneNumber?: string
  bloodType?: string

  // Official Documents
  nationalId?: string
  residenceCardNumber?: string
  rationCardNumber?: string

  // Education
  certificate?: string
  university?: string
  college?: string
  specialization?: string
  graduationYear?: string

  // Employment
  appointmentOrderNumber?: string
  appointmentOrderDate?: string
  jobStartDate?: string
  jobTitle?: string
  currentSchoolStartDate?: string
  administrativeOrderNumber?: string
  administrativeOrderDate?: string
  positionStartDate?: string

  // Family Status
  maritalStatus?: string
  husbandsName?: string
  spouseOccupation?: string
  marriageDate?: string
  numberOfChildren?: string

  // Arrays
  trainingCourses?: Array<{
    name?: string
    duration?: string
    location?: string
    grade?: string
  }>
  appreciationLetters?: Array<{
    letterInfo?: string
    issuedBy?: string
    reason?: string
  }>
}
