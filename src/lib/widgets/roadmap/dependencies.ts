/** The sections each drawn section builds on, by section number. Section 1.1, the overview, is not drawn. */
export const dependencies: Readonly<Record<string, readonly string[]>> = {
	"2.1": [],
	"2.2": ["2.1"],
	"2.3": ["2.2"],
	"2.4": ["2.1", "2.3"],
	"3.1": ["2.2"],
	"3.2": ["3.1"],
	"4.1": ["3.2"],
};

export const destination = "4.1";
