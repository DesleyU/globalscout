using GlobalScout.Application.Abstractions.ReferenceData;

namespace GlobalScout.Application.ReferenceData;

public static class FootballCountries
{
    private static readonly IReadOnlyList<FootballCountry> AllCountries =
    [
        Country("Albania", "AL"),
        Country("Algeria", "DZ"),
        Country("Andorra", "AD"),
        Country("Angola", "AO"),
        Country("Antigua-And-Barbuda", "AG"),
        Country("Argentina", "AR"),
        Country("Armenia", "AM"),
        Country("Aruba", "AW"),
        Country("Australia", "AU"),
        Country("Austria", "AT"),
        Country("Azerbaijan", "AZ"),
        Country("Bahrain", "BH"),
        Country("Bangladesh", "BD"),
        Country("Barbados", "BB"),
        Country("Belarus", "BY"),
        Country("Belgium", "BE"),
        Country("Belize", "BZ"),
        Country("Benin", "BJ"),
        Country("Bermuda", "BM"),
        Country("Bhutan", "BT"),
        Country("Bolivia", "BO"),
        Country("Bosnia", "BA"),
        Country("Botswana", "BW"),
        Country("Brazil", "BR"),
        Country("Bulgaria", "BG"),
        Country("Burkina-Faso", "BF"),
        Country("Burundi", "BI"),
        Country("Cambodia", "KH"),
        Country("Cameroon", "CM"),
        Country("Canada", "CA"),
        Country("Chile", "CL"),
        Country("China", "CN"),
        Country("Chinese-Taipei", "TW"),
        Country("Colombia", "CO"),
        Country("Congo", "CD"),
        Country("Congo-DR", "CG"),
        Country("Costa-Rica", "CR"),
        Country("Croatia", "HR"),
        Country("Cuba", "CU"),
        Country("Curacao", "CW"),
        Country("Cyprus", "CY"),
        Country("Czech-Republic", "CZ"),
        Country("Denmark", "DK"),
        Country("Dominican-Republic", "DO"),
        Country("Ecuador", "EC"),
        Country("Egypt", "EG"),
        Country("El-Salvador", "SV"),
        Country("England", "GB-ENG"),
        Country("Estonia", "EE"),
        Country("Eswatini", "SZ"),
        Country("Ethiopia", "ET"),
        Country("Faroe-Islands", "FO"),
        Country("Fiji", "FJ"),
        Country("Finland", "FI"),
        Country("France", "FR"),
        Country("Gabon", "GA"),
        Country("Gambia", "GM"),
        Country("Georgia", "GE"),
        Country("Germany", "DE"),
        Country("Ghana", "GH"),
        Country("Gibraltar", "GI"),
        Country("Greece", "GR"),
        Country("Grenada", "GD"),
        Country("Guadeloupe", "GP"),
        Country("Guatemala", "GT"),
        Country("Guinea", "GN"),
        Country("Haiti", "HT"),
        Country("Honduras", "HN"),
        Country("Hong-Kong", "HK"),
        Country("Hungary", "HU"),
        Country("Iceland", "IS"),
        Country("India", "IN"),
        Country("Indonesia", "ID"),
        Country("Iran", "IR"),
        Country("Iraq", "IQ"),
        Country("Ireland", "IE"),
        Country("Israel", "IL"),
        Country("Italy", "IT"),
        Country("Ivory-Coast", "CI"),
        Country("Jamaica", "JM"),
        Country("Japan", "JP"),
        Country("Jordan", "JO"),
        Country("Kazakhstan", "KZ"),
        Country("Kenya", "KE"),
        Country("Kosovo", "XK"),
        Country("Kuwait", "KW"),
        Country("Kyrgyzstan", "KG"),
        Country("Laos", "LA"),
        Country("Latvia", "LV"),
        Country("Lebanon", "LB"),
        Country("Lesotho", "LS"),
        Country("Liberia", "LR"),
        Country("Libya", "LY"),
        Country("Liechtenstein", "LI"),
        Country("Lithuania", "LT"),
        Country("Luxembourg", "LU"),
        Country("Macao", "MO"),
        Country("Macedonia", "MK"),
        Country("Malawi", "MW"),
        Country("Malaysia", "MY"),
        Country("Maldives", "MV"),
        Country("Mali", "ML"),
        Country("Malta", "MT"),
        Country("Mauritania", "MR"),
        Country("Mauritius", "MU"),
        Country("Mexico", "MX"),
        Country("Moldova", "MD"),
        Country("Mongolia", "MN"),
        Country("Montenegro", "ME"),
        Country("Morocco", "MA"),
        Country("Myanmar", "MM"),
        Country("Namibia", "NA"),
        Country("Nepal", "NP"),
        Country("Netherlands", "NL"),
        Country("New-Zealand", "NZ"),
        Country("Nicaragua", "NI"),
        Country("Nigeria", "NG"),
        Country("Northern-Ireland", "GB-NIR"),
        Country("Norway", "NO"),
        Country("Oman", "OM"),
        Country("Pakistan", "PK"),
        Country("Palestine", "PS"),
        Country("Panama", "PA"),
        Country("Paraguay", "PY"),
        Country("Peru", "PE"),
        Country("Philippines", "PH"),
        Country("Poland", "PL"),
        Country("Portugal", "PT"),
        Country("Qatar", "QA"),
        Country("Romania", "RO"),
        Country("Russia", "RU"),
        Country("Rwanda", "RW"),
        Country("San-Marino", "SM"),
        Country("Saudi-Arabia", "SA"),
        Country("Scotland", "GB-SCT"),
        Country("Senegal", "SN"),
        Country("Serbia", "RS"),
        Country("Singapore", "SG"),
        Country("Slovakia", "SK"),
        Country("Slovenia", "SI"),
        Country("Somalia", "SO"),
        Country("South-Africa", "ZA"),
        Country("South-Korea", "KR"),
        Country("Spain", "ES"),
        Country("Sudan", "SD"),
        Country("Suriname", "SR"),
        Country("Sweden", "SE"),
        Country("Switzerland", "CH"),
        Country("Syria", "SY"),
        Country("Tajikistan", "TJ"),
        Country("Tanzania", "TZ"),
        Country("Thailand", "TH"),
        Country("Togo", "TG"),
        Country("Trinidad-And-Tobago", "TT"),
        Country("Tunisia", "TN"),
        Country("Turkey", "TR"),
        Country("Turkmenistan", "TM"),
        Country("Uganda", "UG"),
        Country("Ukraine", "UA"),
        Country("United-Arab-Emirates", "AE"),
        Country("Uruguay", "UY"),
        Country("USA", "US"),
        Country("Uzbekistan", "UZ"),
        Country("Venezuela", "VE"),
        Country("Vietnam", "VN"),
        Country("Wales", "GB-WLS"),
        Country("Yemen", "YE"),
        Country("Zambia", "ZM"),
        Country("Zimbabwe", "ZW")
    ];

    private static readonly IReadOnlyDictionary<string, FootballCountry> ByCode =
        AllCountries.ToDictionary(country => country.Code, StringComparer.OrdinalIgnoreCase);

    private static readonly IReadOnlyDictionary<string, FootballCountry> ByName =
        AllCountries
            .SelectMany(country => new[]
            {
                KeyValuePair.Create(country.Name, country),
                KeyValuePair.Create(country.ProviderName, country)
            })
            .GroupBy(pair => pair.Key, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.First().Value,
                StringComparer.OrdinalIgnoreCase);

    private static readonly IReadOnlyList<FootballCountryDto> CountryDtos =
        AllCountries
            .Select(country => new FootballCountryDto(
                country.Name,
                country.Code,
                $"https://media.api-sports.io/flags/{country.Code.ToLowerInvariant()}.svg"))
            .ToArray();

    public static IReadOnlyList<FootballCountryDto> GetAll() => CountryDtos;

    public static FootballCountry? FindByCode(string countryCode) =>
        string.IsNullOrWhiteSpace(countryCode)
            ? null
            : ByCode.GetValueOrDefault(countryCode.Trim());

    public static FootballCountry? FindByName(string countryName) =>
        string.IsNullOrWhiteSpace(countryName)
            ? null
            : ByName.GetValueOrDefault(countryName.Trim());

    private static FootballCountry Country(string providerName, string code) =>
        new(providerName.Replace('-', ' '), code, providerName);
}

public sealed record FootballCountry(string Name, string Code, string ProviderName);
