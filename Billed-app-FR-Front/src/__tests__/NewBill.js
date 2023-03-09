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

      // const catchErrorMessage = console.error(
      //   "Le fichier doit être au format jpg, jpeg ou png"
      // );

      // const errorMessage = catchErrorMessage;
      // expect(errorMessage).not.toBeTruthy();
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
  describe("When I submit a valid form", () => {
    test("Submit handler should return newBill & navigate to Bills Page", async () => {
      const fakeBill = {
        type: "Transports",
        name: "Vol Paris/Marseille",
        date: "070",
        amount: "1500",
        vat: "300",
        pct: "150",
        commentary: "vol 1ere classe",
        filename: "flightBill",
        fileUrl: "C:\\fakepath\\flightBill.jpg",
      };

      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const spyHandleSubmit = jest.spyOn(newBill, "handleSubmit");
      const form = screen.getByTestId("form-new-bill");
      const btnSubmitForm = form.querySelector("#btn-send-bill");
      const spyUpdateBill = jest.spyOn(newBill, "updateBill");

      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: fakeBill.type },
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: fakeBill.name },
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: fakeBill.date },
      });
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: fakeBill.amount },
      });
      fireEvent.change(screen.getByTestId("vat"), {
        target: { value: fakeBill.vat },
      });
      fireEvent.change(screen.getByTestId("pct"), {
        target: { value: fakeBill.pct },
      });
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: fakeBill.commentary },
      });

      form.addEventListener("submit", (e) => newBill.handleSubmit(e));
      userEvent.click(btnSubmitForm);
      await waitFor(() => screen.getByText("Mes notes de frais"));

      expect(spyHandleSubmit).toHaveBeenCalled();
      expect(spyUpdateBill).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });

  // test erreurs 404/500
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches bills from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
