export const DEFAULT_SALARY_FORM = {
  baseSalary: '',
  hra: '0',
  da: '0',
  travelAllowance: '0',
  otherAllowances: '0',
  pfEmployeePercent: '12',
  pfEmployerPercent: '12',
  professionalTax: '0',
  effectiveDate: new Date().toISOString().split('T')[0],
};

export const toSalaryForm = (data = {}) => ({
  baseSalary:
    data.baseSalary !== undefined && data.baseSalary !== null
      ? String(data.baseSalary)
      : DEFAULT_SALARY_FORM.baseSalary,
  hra:
    data.hra !== undefined && data.hra !== null
      ? String(data.hra)
      : DEFAULT_SALARY_FORM.hra,
  da:
    data.da !== undefined && data.da !== null
      ? String(data.da)
      : DEFAULT_SALARY_FORM.da,
  travelAllowance:
    data.travelAllowance !== undefined && data.travelAllowance !== null
      ? String(data.travelAllowance)
      : DEFAULT_SALARY_FORM.travelAllowance,
  otherAllowances:
    data.otherAllowances !== undefined && data.otherAllowances !== null
      ? String(data.otherAllowances)
      : DEFAULT_SALARY_FORM.otherAllowances,
  pfEmployeePercent:
    data.pfEmployeePercent !== undefined && data.pfEmployeePercent !== null
      ? String(data.pfEmployeePercent)
      : DEFAULT_SALARY_FORM.pfEmployeePercent,
  pfEmployerPercent:
    data.pfEmployerPercent !== undefined && data.pfEmployerPercent !== null
      ? String(data.pfEmployerPercent)
      : DEFAULT_SALARY_FORM.pfEmployerPercent,
  professionalTax:
    data.professionalTax !== undefined && data.professionalTax !== null
      ? String(data.professionalTax)
      : DEFAULT_SALARY_FORM.professionalTax,
  effectiveDate: data.effectiveDate || DEFAULT_SALARY_FORM.effectiveDate,
});

export const parseAmount = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateSalaryGross = (form) =>
  parseAmount(form.baseSalary) +
  parseAmount(form.hra) +
  parseAmount(form.da) +
  parseAmount(form.travelAllowance) +
  parseAmount(form.otherAllowances);

export const buildSalaryPayload = (form) => ({
  baseSalary: parseAmount(form.baseSalary),
  hra: parseAmount(form.hra),
  da: parseAmount(form.da),
  travelAllowance: parseAmount(form.travelAllowance),
  otherAllowances: parseAmount(form.otherAllowances),
  pfEmployeePercent: parseAmount(form.pfEmployeePercent),
  pfEmployerPercent: parseAmount(form.pfEmployerPercent),
  professionalTax: parseAmount(form.professionalTax),
  effectiveDate: form.effectiveDate,
});
