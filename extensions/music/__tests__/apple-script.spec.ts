import { createQueryString } from "../src/util/apple-script";

describe("createQueryString", () => {
  it("should create an escaped query", () => {
    const result = createQueryString({ id: 1, name: "test" });
    expect(result).toEqual("id=1 & name=test");
  });
});
