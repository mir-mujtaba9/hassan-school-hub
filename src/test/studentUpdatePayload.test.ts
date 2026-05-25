import { describe, it, expect } from "vitest";
import type { Student } from "@/data/students";
import { buildStudentUpdatePayload } from "@/lib/studentUpdate";

const base: Omit<Student, "id"> = {
  fullName: "A",
  fatherName: "B",
  dateOfBirth: "2012-01-01",
  gender: "Male",
  religion: "Islam",
  nationality: "Pakistani",
  placeOfBirth: "X",
  motherTongue: "Urdu",
  studentPhone: "",
  fatherPhone: "0300",
  motherName: "",
  motherPhone: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  homeAddress: "Addr",
  district: "",
  tehsil: "",
  admissionDate: "2025-02-03",
  studentClass: "Class 1",
  class_id: "1",
  section: "A",
  rollNumber: 1,
  previousSchool: "",
  previousClass: "",
  previousResult: "N/A",
  monthlyFee: 1600,
  discount: "No Discount",
  discountedFee: 1600,
  discountReason: "",
  bFormNumber: "",
  fatherCnic: "",
  previousTcNumber: "",
  medicalCondition: "",
  notes: "",
  status: "Active",
};

describe("buildStudentUpdatePayload", () => {
  it("returns empty payload when nothing changed", () => {
    const payload = buildStudentUpdatePayload(base, { ...base });
    expect(payload).toEqual({});
  });

  it("includes only changed fields", () => {
    const payload = buildStudentUpdatePayload(base, { ...base, fatherName: "C" });
    expect(payload).toEqual({ father_name: "C" });
  });

  it("treats cleared string as no change", () => {
    const payload = buildStudentUpdatePayload(base, { ...base, fatherName: "" });
    expect(payload).toEqual({});
  });

  it("normalizes admission_date to YYYY-MM-DD", () => {
    const initial = { ...base, admissionDate: "2025-02-03T00:00:00.000Z" };
    const form = { ...base, admissionDate: "2025-02-04T00:00:00.000Z" };
    const payload = buildStudentUpdatePayload(initial, form);
    expect(payload).toEqual({ admission_date: "2025-02-04" });
  });

  it("requires discount_reason only when discount changed away", () => {
    const payload = buildStudentUpdatePayload(
      base,
      { ...base, discount: "25%", discountReason: "Staff" },
    );
    expect(payload).toEqual({ discount: "25%", discount_reason: "Staff" });
  });

  it("omits discount_reason when discount becomes No Discount", () => {
    const initial = { ...base, discount: "25%", discountedFee: 1200, discountReason: "Staff" };
    const payload = buildStudentUpdatePayload(initial, { ...initial, discount: "No Discount" });
    expect(payload).toEqual({ discount: "No Discount" });
  });

  it("allows discounted_fee change without discount change", () => {
    const initial = { ...base, discount: "No Discount" };
    const payload = buildStudentUpdatePayload(initial, { ...initial, discountedFee: 1500 });
    expect(payload).toEqual({ discounted_fee: 1500 });
  });

  it("includes discount_reason when discount changed even if reason unchanged", () => {
    const initial = { ...base, discount: "No Discount", discountReason: "Merit" };
    const payload = buildStudentUpdatePayload(initial, { ...initial, discount: "25%" });
    expect(payload).toEqual({ discount: "25%", discount_reason: "Merit" });
  });
});
