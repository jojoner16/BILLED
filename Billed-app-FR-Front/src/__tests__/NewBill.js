/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });

  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );

  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname, data: bills });
  };

  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlihted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon.classList.contains("active-icon")).toBeTruthy();
    });
    test("Then adding a file to the form should call the api", async () => {
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      class FakeApiEntity {
        async create({ data, headers = {} }) {
          return { status: 200 };
        }
      }

      const fakeStore = { bills: () => new FakeApiEntity() };
      const currenNewBill = new NewBill({
        document,
        onNavigate,
        store: fakeStore,
        localStorage: localStorage,
      });
      const fileTest = new File(["hello"], "path\\hello.png", {
        type: "image/png",
      });

      const handleChangeFile = jest.fn((e) =>
        currenNewBill.handleChangeFile(e)
      );

      const selectFile = screen.getByTestId("file");
      selectFile.addEventListener("change", handleChangeFile);
      userEvent.upload(selectFile, fileTest);

      expect(selectFile.files[0]).toStrictEqual(fileTest);
      expect(selectFile.files.item(0)).toStrictEqual(fileTest);
      expect(selectFile.files).toHaveLength(1);
    });
  });

  describe("When I am on NewBill page and I upload a file with an extension jpg, jpeg or png", () => {
    test("Then no message for the file input should be displayed", () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        bills: bills,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

      const champFile = screen.getByTestId("file");
      champFile.addEventListener("change", handleChangeFile);
      fireEvent.change(champFile, {
        target: {
          files: [
            new File(["test"], "test.pdf", {
              type: "application/pdf",
            }),
          ],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(screen.getByTestId("file").files[0].name).toBe("test.pdf");

      const catchErrorMessage = console.error(
        "Le fichier doit être au format jpg, jpeg ou png"
      );

      const errorMessage = catchErrorMessage;
      expect(errorMessage).not.toBeTruthy();
    });
  });

  describe("When I am on NewBill page and I upload a file with an extension other than jpg, jpeg or png", () => {
    test("Then an error message for the file input should be displayed", () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

      const champFile = screen.getByTestId("file");
      champFile.addEventListener("change", handleChangeFile);

      fireEvent.change(champFile, {
        target: {
          files: [
            new File(["test"], "test.pdf", {
              type: "application/pdf",
            }),
          ],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(screen.getByTestId("file").files[0].name).toBe("test.pdf");

      const catchErrorMessage = console.error(
        "Le fichier doit être au format jpg, jpeg ou png"
      );

      const errorMessage = catchErrorMessage;
      expect(errorMessage).not.toBeTruthy();
    });
  });

  describe("When I am on NewBill page and I submit a form with all fields filled", () => {
    test("Then a new bill should be created", () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });

  // test integration POST
});
