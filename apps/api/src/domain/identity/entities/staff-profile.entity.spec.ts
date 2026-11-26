import { InvalidStaffProfileError } from "../../errors/invalid-staff-profile.error";
import { UniqueEntityId } from "../../shared/unique-entity-id";
import { StaffProfile } from "./staff-profile.entity";

const NOW = new Date("2026-11-25T15:00:00.000Z");

describe("StaffProfile.create", () => {
  it("uses the user id and records the dates", () => {
    const userId = new UniqueEntityId();

    const profile = StaffProfile.create({ userId }, NOW);

    expect(profile.id.equals(userId)).toBe(true);
    expect(profile.createdAt).toEqual(NOW);
    expect(profile.updatedAt).toEqual(NOW);
  });

  it("makes qualification and hire date optional", () => {
    const profile = StaffProfile.create({ userId: new UniqueEntityId() }, NOW);

    expect(profile.qualification).toBeNull();
    expect(profile.hiredAt).toBeNull();
  });

  it("trims the qualification and treats blank as null", () => {
    const withText = StaffProfile.create({ userId: new UniqueEntityId(), qualification: "  Licenciatura  " }, NOW);
    const blank = StaffProfile.create({ userId: new UniqueEntityId(), qualification: "   " }, NOW);

    expect(withText.qualification).toBe("Licenciatura");
    expect(blank.qualification).toBeNull();
  });

  it("accepts 150 characters and rejects 151", () => {
    const make = (n: number) =>
      StaffProfile.create({ userId: new UniqueEntityId(), qualification: "a".repeat(n) }, NOW);

    expect(() => make(150)).not.toThrow();
    expect(() => make(151)).toThrow(InvalidStaffProfileError);
  });

  it("rejects an invalid hire date", () => {
    expect(() => StaffProfile.create({ userId: new UniqueEntityId(), hiredAt: new Date("abc") }, NOW)).toThrow(
      InvalidStaffProfileError,
    );
  });

  it("returns copies of the dates", () => {
    const profile = StaffProfile.create({ userId: new UniqueEntityId(), hiredAt: new Date("2020-02-03") }, NOW);

    profile.hiredAt?.setFullYear(1900);

    expect(profile.hiredAt).toEqual(new Date("2020-02-03"));
  });
});
